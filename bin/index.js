#!/usr/bin/env node
const { promises: Fs } = require('fs')
const copy = require("recursive-copy");
const rimraf = require('rimraf')
const InitialSchemaTemplate = require('./schema.js')
const fse = require('fs-extra')
const { spawn, exec } = require('child_process')
//const prettier = require("prettier");


var argv = require('yargs/yargs')(process.argv.slice(2))
    .demandCommand(1)
    .argv;

const targetDir = argv?.target
const target = targetDir ? `${process.cwd()}/${targetDir}` : `${process.cwd()}/r2om-repository/`

const ConfigFileName = 'r2om.config.js'
const ConfigFilePath = `${process.cwd()}/${ConfigFileName}`


async function exists() {
    try {
        await Fs.access(ConfigFilePath)
        return true
    } catch {
        return false
    }
}



const prepareTemplatefiles = async () => {
    await new Promise(resolve => rimraf(target, resolve));
    return new Promise((resolve) => {
        copy(
            "./node_modules/r2om/src/lib/upstash",
            `${target}/`,
            (error, results) => {
                if (error) {
                    console.error("Copy failed: " + error);
                } else {
                    console.info("\n Copied " + results.length + " files ⚡️ \n");
                }
            }
        );
        setTimeout(() => {
            resolve(true)
        }, 200);
    })
};


const createFile = async (filename) => {
    await Fs.writeFile(filename, InitialSchemaTemplate)
    console.log(`${filename} Created... ✨`);
}

if (argv._[0] === 'init') {
    exists().then(res => {
        if (!res) {
            createFile(ConfigFileName)
        } else {
            console.log('Config File exists Already 😳')
        }
    })
}

const generateType = () => {
    return new Promise((resolve, reject) => {

        exec(`node ${ConfigFileName}`, (err, stdout, stderr) => {
            if (err) {
                console.log('err')
                console.log(err)
            }
            if (stdout) {
                console.log(stdout)
                resolve()
            }
            if (stderr) {
                console.log(
                    stderr
                )
            }
        })
    })
}

if (argv._[0] === 'generate') {
    exists().then(res => {
        if (res) {
            prepareTemplatefiles().then(() => {
                const destination = `${target}/lib/${ConfigFileName}`
                fse.copy(ConfigFilePath, destination).then(() => {
                    process.chdir(`${target}/lib/`)
                    generateType().then(() => {
                        fse.rm(destination)
                    })
                })
            })
        } else {
            console.log('The config file does not exist in the current location 😔')
        }
    })
}



