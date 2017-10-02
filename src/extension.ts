import * as vscode from 'vscode';
import { shouldSortOnSave } from './options';
import sortImports from './sortImports';
import sortInsideEditor from './sortInsideEditor';
import sortOnSave from './sortOnSave';

'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

let sortOnSaveDisposer: vscode.Disposable;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let sortOnCommandDisposer = vscode.commands.registerCommand('extension.sortTypescriptImports', () => {
        // The code you place here will be executed every time your command is executed

        if (vscode.window.activeTextEditor.document.languageId === 'typescript'
            || vscode.window.activeTextEditor.document.languageId === 'typescriptreact') {
            sortInsideEditor();
        }
    });

    let sortAllOnCommandDisposer = vscode.commands.registerCommand('extension.sortTypescriptImportsAll', () => {
        // The code you place here will be executed every time your command is executed
        const filesPromise = vscode.workspace.findFiles('**/*.ts', '**/node_modules/**');

        filesPromise.then(files => {
            if (files && files.length) {
                files.forEach(file => {
                    const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
                    let document: vscode.TextDocument;
                    vscode.workspace.openTextDocument(file)
                        .then(doc => {
                            document = doc;
                            edit.set(doc.uri, sortImports(doc))
                        })
                        .then(() => { 
                            vscode.workspace.applyEdit(edit).then(() => {
                                document.save();
                                console.log(`document ${document.fileName} saved`);
                            })
                        });
                });
            }
        });
    });

    let configurationWatcher = vscode.workspace.onDidChangeConfiguration(configure);
    configure();

    context.subscriptions.push(
        sortOnCommandDisposer,
        sortAllOnCommandDisposer,
        configurationWatcher);
}

function configure() {
    if (shouldSortOnSave()) {
        enableFileWatcher();
    } else if (!shouldSortOnSave()) {
        disableFileWatcher();
    }
}

function enableFileWatcher() {
    if (!sortOnSaveDisposer) {
        sortOnSaveDisposer = vscode.workspace.onWillSaveTextDocument(sortOnSave);
    }
}

function disableFileWatcher() {
    if (sortOnSaveDisposer) {
        sortOnSaveDisposer.dispose();
        sortOnSaveDisposer = undefined;
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
    disableFileWatcher();
}