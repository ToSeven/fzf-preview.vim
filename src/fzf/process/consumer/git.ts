import { execFzfCommand } from "@/connector/fzf"
import { gitAdd, gitPatch, gitReset } from "@/connector/git"
import { vimEchoMessage } from "@/connector/util"
import { createBulkLineConsumer, createSingleLineConsumer } from "@/fzf/process/consumer/consumer"

export const gitAddConsumer = createBulkLineConsumer(async (convertedLines) => {
  for (const line of convertedLines) {
    // eslint-disable-next-line no-await-in-loop
    await gitAdd(line)
  }

  await vimEchoMessage(`git add ${convertedLines.join(" ")}`)
  await execFzfCommand("FzfPreviewGitStatus")
})

export const gitResetConsumer = createBulkLineConsumer(async (convertedLines) => {
  for (const line of convertedLines) {
    // eslint-disable-next-line no-await-in-loop
    await gitReset(line)
  }

  await vimEchoMessage(`git reset ${convertedLines.join(" ")}`)
  await execFzfCommand("FzfPreviewGitStatus")
})

export const gitPatchConsumer = createSingleLineConsumer(async (convertedLine) => {
  await gitPatch(convertedLine)
})
