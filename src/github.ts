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
import { getOctokit } from '@actions/github'
import * as cache from '@actions/tool-cache'
import * as os from 'os'
import * as path from 'path'

const osPlatform = os.platform() as string

export interface Download {
  path: string
  version: string
}

interface GithubTag {
  tag_name: string
}

export async function downloadNsv(
  token: string,
  version: string
): Promise<Download> {
  const result = await queryVersion(token, 'nsv', version)
  if (!result) {
    throw new Error(`Failed to download latest version of gpg-import`)
  }

  let filename = ''
  let binary = 'nsv'
  const ver = result.tag_name.replace(/^v/, '')

  if (osPlatform === 'linux') {
    filename = `nsv_${ver}_linux_x86_64.tar.gz`
  } else if (osPlatform == 'darwin') {
    filename = `nsv_${ver}_darwin_x86_64.tar.gz`
  } else {
    filename = `nsv_${ver}_windows_x86_64.zip`
    binary = 'nsv.exe'
  }

  const dir = await download('nsv', result.tag_name, filename)
  return { path: path.join(dir, binary), version: result.tag_name }
}

export async function downloadGpgImport(token: string): Promise<Download> {
  const result = await queryVersion(token, 'gpg-import', 'latest')
  if (!result) {
    throw new Error(`Failed to download latest version of gpg-import`)
  }

  let filename = ''
  let binary = 'gpg-import'

  if (osPlatform === 'linux') {
    filename = `gpg-import-${result.tag_name}-x86_64-unknown-linux-musl.tar.gz`
  } else if (osPlatform == 'darwin') {
    filename = `gpg-import-${result.tag_name}-x86_64-apple-darwin.tar.gz`
  } else {
    filename = `gpg-import-${result.tag_name}-x86_64-pc-windows-msvc.zip`
    binary = 'gpg-import.exe'
  }

  const dir = await download('gpg-import', result.tag_name, filename)
  return { path: path.join(dir, binary), version: result.tag_name }
}

async function download(
  repo: string,
  version: string,
  filename: string
): Promise<string> {
  const url = `https://github.com/purpleclay/${repo}/releases/download/${version}/${filename}`
  core.debug(`Downloading ${repo} using URL ${url}`)
  const toolPath = await cache.downloadTool(url)

  core.debug(`Extracting download from ${toolPath}`)
  const extractPath = await cache.extractTar(toolPath)

  core.debug(`Caching download at ${extractPath}`)
  return await cache.cacheDir(extractPath, repo, version)
}

const queryVersion = async (
  token: string,
  repo: string,
  version: string
): Promise<GithubTag | null> => {
  const octokit = getOctokit(token)

  if (version === 'latest') {
    const { data: release } = await octokit.rest.repos.getLatestRelease({
      owner: 'purpleclay',
      repo: repo
    })
    return release
  }

  const { data: release } = await octokit.rest.repos.getReleaseByTag({
    owner: 'purpleclay',
    repo: repo,
    tag: version
  })
  return release
}
