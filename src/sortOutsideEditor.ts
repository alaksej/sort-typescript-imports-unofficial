import * as vscode from 'vscode';
import sortImports from './sortImports';

export default function sortOutsideEditor(filesPromise: Thenable<vscode.Uri[]>) {
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
}