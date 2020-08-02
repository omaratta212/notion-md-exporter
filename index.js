"use strict";
const env = require('dotenv').config({path: __dirname + '/.env'})
const http = require('https');
const fs = require('fs');
const fetch = require('node-fetch')
const AdmZip = require('adm-zip');

const token_v2 = env.parsed.TOKEN_V2
const blogPageId = env.parsed.PARENT_PAGE_ID
const blockId = `${blogPageId.substring(0,8)}-${blogPageId.substring(8,12)}-${blogPageId.substring(12,16)}-${blogPageId.substring(16,20)}-${blogPageId.substring(20,blogPageId.length)}`

if(!token_v2 || !blogPageId || !blockId){
    throw new Error('Environment variables are not set correctly!')
}

const fetchDefaults = {
    headers: {
        "content-type": "application/json",
        "cookie": `token_v2=${token_v2};`
    },
    method: "GET",
}

const delay = (milliseconds)=> {
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

const extractZip = ()=> {
    const zip = new AdmZip("./content/notionExport.zip");
    zip.extractAllTo("./content/notion/", true);
}

(async ()=>{
    /* Queue Notion task to export the page */
    const taskId = await requestExport(blockId)

    /* Check the task status and get downloadURL when finished */
    const downloadURL = await getExportedWhenReady(taskId)


    /* Open file stream */
    const file = fs.createWriteStream("content/notionExport.zip");

    /* Download file and store in the opened stream */
    http.get(downloadURL,(r)=>{r.pipe(file)})

    /* Extract the zip file to ./content/notion directory */
    extractZip()
})()
