#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const child_process = require('child_process')

const program = require('commander')
const inquirer = require('inquirer')
const glob = require('glob')
const ora = require('ora')
const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const latestVersion = require('latest-version')
const rm = require('rimraf').sync

program.usage('<project-name>').parse(process.argv)
let projectName = program.args[0]
if (!projectName) {
    program.help()
}

const list = glob.sync('*')
let rootName = path.basename(process.cwd())
let stepFlag = false

if (list.length) {
    const index = list.findIndex((item) => item === projectName)
    if (index > -1) {
        const p = list[index]
        const realFileName = path.resolve(process.cwd(), path.join('.', p))
        const stat = fs.statSync(realFileName)
        if (stat) {
            const isDir = stat.isDirectory()
            if (isDir) {
                stepFlag = true
                console.log('该目录已存在')
            }
        }
    } else {
        rootName = projectName
    }
} else {
    rootName = projectName
}

if (!stepFlag) {
    inquirer.prompt([
        {
            name: 'projectDescription',
            message: '请输入项目描述',
        },
        {
            name: 'author',
            message: '请输入项目作者',
        },
        {
            name: 'features',
            message: '请输入项目需要集成的功能',
            type: 'checkbox',
            choices: [
                { name: 'MongoDB模块', value: 'mongo' },
                { name: 'Redis模块', value: 'redis' },
            ]
        },
        {
            name: 'cors',
            message: '是否开启跨域配置',
            type: 'confirm'
        },
        {
            name: 'gzip',
            message: '是否开启Gzip配置',
            type: 'confirm'
        },
    ]).then(async answers => {
        const spinner = ora('获取依赖版本...')
        spinner.start()
        answers['loggerVerion'] = await latestVersion('@mykurisu/fast-nest-logger')
        // answers['mongoVersion'] = await latestVersion('@mykurisu/fast-nest-mongo')
        // answers['redisVersion'] = await latestVersion('@mykurisu/fast-nest-redis')
        spinner.succeed('获取依赖完成')
        creator(rootName, answers)
    })
}


function creator(rootName, answers) {
    answers.projectName = projectName
    answers.projectVersion = '0.0.0'
    const url = 'https://github.com/mykurisu/fast-nest.git'
    const cmd = `git clone -b main ${url} .fast-nest-temp`
    const templateSrc = `${process.cwd()}/.fast-nest-temp`
    const downloadSpinner = ora(`正在下载项目模板，源地址：${url}`)
    downloadSpinner.start()
    child_process.exec(cmd, {}, (err) => {
        if (err) {
            downloadSpinner.fail()
            console.log(err)
            return
        }
        downloadSpinner.succeed()

        const buildSpinner = ora('正在生成模板...')
        buildSpinner.start()
        const metadata = Object.assign({}, answers)
        if (metadata.features && metadata.features.length > 0) {
            metadata.features.forEach((feature) => {
                metadata[`feature_${feature}`] = true
            });
        }
        rm(`${templateSrc}/.git`)
        Metalsmith(process.cwd())
            .metadata(metadata)
            .clean(false)
            .source('.fast-nest-temp')
            .destination(rootName)
            .use((files, metalsmith, done) => {
                const meta = metalsmith.metadata()
                Object.keys(files).forEach(fileName => {
                    const t = files[fileName].contents.toString()
                    files[fileName].contents = Buffer.from(Handlebars.compile(t)(meta))
                })
                done(null, files, metalsmith)
            }).build(err => {
                rm(templateSrc)
                if (err) {
                    buildSpinner.fail()
                    console.log(err)
                } else {
                    buildSpinner.succeed()
                    console.log('模板已完成初始化，请输入以下指令启动项目。')
                    console.log('npm isntall')
                    console.log('npm start')
                }
            })
    })
}

