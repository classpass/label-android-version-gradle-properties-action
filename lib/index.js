"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
const minimatch_1 = require("minimatch");
const properties_reader_1 = __importDefault(require("properties-reader"));
process.on('unhandledRejection', handleError);
main().catch(handleError);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let gradlePropertiesPath = core.getInput('gradle-properties-path');
        if (!fs.existsSync(gradlePropertiesPath)) {
            core.setFailed(`The file path for gradle.properties does not exist or is not found: ${gradlePropertiesPath}`);
            process.exit(1);
        }
        core.debug(`Running task with ${gradlePropertiesPath}`);
        const token = core.getInput("repo-token", { required: true });
        const prNumber = getPrNumber();
        if (!prNumber) {
            core.setFailed("Could not get pull request number from context, exiting");
            process.exit(1);
        }
        const properties = (0, properties_reader_1.default)(gradlePropertiesPath);
        const versionName = properties.get('VERSION_NAME');
        core.info(`Read version number ${versionName} from gradle.properties`);
        const client = github.getOctokit(token);
        let addLabel = true;
        const changedFilesConfig = core.getInput("changed-files", { required: false });
        if (changedFilesConfig) {
            const changedFiles = yield getChangedFiles(client, prNumber);
            const matcher = new minimatch_1.Minimatch(changedFilesConfig);
            if (!changedFiles.some(f => matcher.match(f))) {
                core.info(`No matching changes found in files at path ${changedFilesConfig}, skipping label.`);
                addLabel = false;
            }
        }
        let labelName = versionName;
        const labelFormat = core.getInput("label-format", { required: false });
        if (labelFormat) {
            labelName = labelFormat.replace('{version}', versionName);
        }
        if (addLabel) {
            yield client.rest.issues.addLabels({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: prNumber,
                labels: [labelName],
            });
        }
    });
}
function handleError(err) {
    console.error(err);
    core.setFailed(`Unhandled error: ${err}`);
}
function getPrNumber() {
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
        return undefined;
    }
    return pullRequest.number;
}
function getChangedFiles(client, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const listFilesOptions = client.rest.pulls.listFiles.endpoint.merge({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: prNumber,
        });
        const listFilesResponse = yield client.paginate(listFilesOptions);
        const changedFiles = listFilesResponse.map((f) => f.filename);
        core.debug("Found changed files:");
        for (const file of changedFiles) {
            core.debug("  " + file);
        }
        return changedFiles;
    });
}
