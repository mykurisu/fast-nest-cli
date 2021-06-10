const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')


program.usage('<module-name>').parse(process.argv)
let moduletName = program.args[0]
if (!moduletName) {
    program.help()
}

const dir = `${process.cwd()}/src`
const _fileName = moduletName.slice(0, 1).toLocaleLowerCase() + moduletName.slice(1)
const _moduleName = moduletName.slice(0, 1).toLocaleUpperCase() + moduletName.slice(1)
const modulesDir = path.join(dir, `/${_fileName}`)
const moduleContent = templateCreator('module')
const controllerContent = templateCreator('controller')
const serviceContent = templateCreator('service')
function templateCreator(type) {
    const template = fs.readFileSync(path.join(__dirname, `../lib/template/${type}.template`), 'utf-8')
    const content = template.replace(/{{_moduleName}}/g, _moduleName).replace(/{{_fileName}}/g, _fileName)
    return content
}

fs.stat(dir, (err, stat) => {
    if (err) {
        return console.log(chalk.red('请在项目根目录运行指令'))
    }

    moduleCreate()
})

function moduleCreate() {

    fs.stat(modulesDir, (err, stat) => {
        if (!err) {
            return console.log(chalk.red('模块重名，请更改'))
        }

        if (stat) {
            const isDirectory = stat.isDirectory()
            if (isDirectory) return console.log(chalk.red('模块重名，请更改'))
        }

        fs.mkdir(modulesDir, (err) => {
            if (err) {
                return console.log(chalk.red('模块创建失败'))
            }

            try {
                fs.writeFileSync(path.join(modulesDir, `./${_fileName}.module.ts`), moduleContent)
                fs.writeFileSync(path.join(modulesDir, `./${_fileName}.controller.ts`), controllerContent)
                fs.writeFileSync(path.join(modulesDir, `./${_fileName}.service.ts`), serviceContent)
                console.log(chalk.green('模块创建完毕'))
            } catch (error) {
                console.log(error)
            }

        })

    })
}
