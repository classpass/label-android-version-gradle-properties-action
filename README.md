# Label iOS version from Info.plist action

GitHub Action that labels your PR with the `VERSION_NAME` from your Android app's gradle.properties file.

Formed from a mash up of https://github.com/damienaicheh/update-ios-version-info-plist-action and https://github.com/actions/labeler

## Inputs

### `repo-token`

**Required** GitHub access token, e.g. `${{ secrets.GITHUB_TOKEN }}`

### `gradle-properties-path`

**Required** The relative path for the gradle.properties file.

###  `changed-files`

Path glob: only apply the label if there are changed files in this path.

###  `label-format`

String format to customize the format of the label. Default is just the raw version number. Action will replace the substring `{version}` in this format with the version number it reads from the properties file.

## Usage

```yaml
- name: Label from gradle.properties
  uses: classpass/label-android-version-gradle-properties-action@v1.0.0
  with:
    repo-token: "${{ secrets.GITHUB_TOKEN }}"
    gradle-properties-path: './src/android/gradle.properties'
    changed-files: 'src/android/**' # optional
    label-format: 'Android {version}' # optional
```
