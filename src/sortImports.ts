import * as vscode from 'vscode';
import parseImports from './parseImportNodes';
import processImports from './processImports';
import writeImports from './writeImports';

export default function sortImports(document: vscode.TextDocument) {
    let imports = parseImports(document);
    let result = processImports(imports);
    imports = result.importClauses;
    let sortedImportText = writeImports(imports);

    let edits: vscode.TextEdit[] = result.removeClauses.map(clause => vscode.TextEdit.delete(clause.range));
    edits.push(vscode.TextEdit.insert(new vscode.Position(0, 0), sortedImportText));
    console.log('sorting complete');
    return edits;
}