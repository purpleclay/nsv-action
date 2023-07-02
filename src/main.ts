// Copyright (c) 2023 Purple Clay
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// in the Software without restriction, including without limitation the rights
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { Download, downloadGpgImport, downloadNsv } from './github'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
    const version = core.getInput('version')
    const nextOnly = core.getBooleanInput('next-only')

    if (process.env.GPG_PRIVATE_KEY && process.env.GPG_PRIVATE_KEY != '') {
      await core.group('Importing GPG Key', async () => {
        const download = await downloadGpgImport(token)
        core.info(`Downloaded gpg-import: ${download.version}`)

        await exec.exec(`${download.path}`)
      })
    }

    let download: Download
    await core.group('Downloading NSV', async () => {
      download = await downloadNsv(token, version)
      core.info(`nsv: ${download.version}`)
    })

    await core.group('Running NSV', async () => {
      const nextSemVer = await nsv(download.path, nextOnly ? 'next' : 'tag')
      core.info(nextSemVer)
      core.setOutput('nsv', nextSemVer)
    })
  } catch (error) {
    const err = error as Error
    core.setFailed(err.message)
  }
}

async function nsv(path: string, cmd: string): Promise<string> {
  return await exec.getExecOutput(`${path} ${cmd}`, [], {
    ignoreReturnCode: true,
  }).then(res => {
    if (res.stderr.length > 0 && res.exitCode != 0) {
      throw new Error(res.stderr);
    }

    return res.stdout.trim()
  })
}

run()
