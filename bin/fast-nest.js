#!/usr/bin/env node
const program = require('commander')
const packageJson = require('../package.json', '-v, --version');
program.version(packageJson.version)
	.usage('<command> [项目名称]')
	.command('init', '创建新项目')
	.command('module', '创建新模块')
	.parse(process.argv)


program.parse(process.argv)