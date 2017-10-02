import * as vscode from 'vscode';
import { RegexSortingItem } from './regexSortingItem';

export function getTabString(editor: vscode.TextEditor = vscode.window.activeTextEditor) {
    if (editor.options.insertSpaces) {
        return new Array(editor.options.tabSize as number + 1).join(' ');
    } else {
        return '\t';
    }
}

export function getMaxNamedImportsPerSingleLine() {
    return getExtensionConfig().get('maxNamedImportsInSingleLine');
}

export function getUseEmptyLineBetweenBlocks() {
    return getExtensionConfig().get('useEmptyLineBetweenBlocks');
}

export function getGroupByPath() {
    return getExtensionConfig().get('groupByPath');
}

export function getSortOption() {
    return getExtensionConfig().get('sortMethod');
}

export function getQuoteToken() {
    switch (getExtensionConfig().get('quoteStyle')) {
        case 'double':
            return '"';
        case 'single':
        default:
            return '\'';
    }
}

export function shouldSortOnSave(): boolean {
    return getExtensionConfig().get('sortOnSave') as boolean;
}

export function getPathSortOrdering(): string[] {
    return getExtensionConfig().get('pathSortOrder') as string[];
}

export function getRegexSortOrdering(): RegexSortingItem[] {
    return getExtensionConfig().get('regexSortOrder') as RegexSortingItem[];
}

export function getOmitSemicolon(): boolean {
    return getExtensionConfig().get('omitSemicolon') as boolean;
}

function getExtensionConfig() {
    return vscode.workspace.getConfiguration('typescript.extension.sortImports');
}
