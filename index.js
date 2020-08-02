"use strict";
const env = require('dotenv').config()
const fs = require('fs');
const fetch = require('node-fetch')
const AdmZip = require('adm-zip')

const token_v2 = env.parsed.TOKEN_V2
const blogPageId = env.parsed.PARENT_PAGE_ID
const contentPath = env.parsed.CONTENT_PATH || './content/'

if (!token_v2 || !blogPageId) throw new Error('Environment variables are not set correctly!')

const blockId = `${blogPageId.substring(0, 8)}-${blogPageId.substring(8, 12)}-${blogPageId.substring(12, 16)}-${blogPageId.substring(16, 20)}-${blogPageId.substring(20, blogPageId.length)}`
if (!blockId) throw new Error('Environment variables are not set correctly!')

const fetchDefaults = {
    headers: {
        "content-type": "application/json",
        "cookie": `token_v2=${token_v2};`
    },
    method: "GET",
}

const delay = (milliseconds) => {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve("Done");
        }, milliseconds);
    });
}

// const getCollectionPages

const requestExport = async (blockId) => {
    const options = {
        ...fetchDefaults,
        method: "POST",
        body: JSON.stringify({
            task: {
                "eventName": "exportBlock",
                "request": {
                    "blockId": blockId,
                    "recursive": true,
                    "exportOptions": {
                        "exportType": "markdown",
                        "timeZone": "Africa/Cairo",
                        "locale": "en"
                    }
                }
            }
        })
    }

    try {
        let response = await fetch('https://www.notion.so/api/v3/enqueueTask', options)
        response = await response.json()
        return response['taskId']
    } catch (e) {
        throw new Error(`Error while scheduling the export task! ERROR DETAILS: ${e}`)
    }
}

const getExportedWhenReady = async (taskId) => {
    const options = {
        ...fetchDefaults,
        method: "POST",
        body: JSON.stringify({taskIds: [taskId]})
    }

    try {
        let response = await fetch('https://www.notion.so/api/v3/getTasks', options)
        response = await response.json()

        const status = response['results'][0]['status']

        if (status && status.type === 'progress') {
            await delay(2000)
            return await getExportedWhenReady(taskId)
        } else if (status && status.type === 'complete') {
            return status['exportURL']
        }
    } catch (e) {
        throw new Error(`Error while fetching the export download URL! ERROR DETAILS: ${e}`)
    }

}

const extractZip = (fileName, path) => {
    const zip = new AdmZip(fileName)
    zip.extractAllTo(path, true)
}


(async () => {
        /* Queue Notion task to export the page */
        console.log('Requesting notion export...')
        const taskId = await requestExport(blockId)
        console.log('Requesting notion export done.\n Checking if your download is ready...')

        /* Check the task status and get downloadURL when finished */
        const downloadURL = await getExportedWhenReady(taskId)
        console.log('Download is ready.\n downloading...')

        /* Open file stream */
        const file = fs.createWriteStream("content/notionExport.zip")

        /* Download file */
        const response = await fetch(downloadURL)

        /* Store in the opened stream */
        response.body.pipe(file)

        response.body.on("finish", () => {
            /* Extract the zip file to  directory */
            console.log('Download done.\n Extracting zip file...')
            extractZip('./content/notionExport.zip', contentPath)
            fs.unlink('./content/notionExport.zip', ()=> {
                console.log('Extracting done.\n and cleared the zip file! have fun')
            })
        })
    }
)()
