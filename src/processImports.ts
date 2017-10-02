import * as options from './options';
import { TypescriptImport } from './TypescriptImport';
import * as vscode from 'vscode';

export default function processImports(importClauses: TypescriptImport[]): { removeClauses: TypescriptImport[], importClauses: TypescriptImport[] } {
    let removeClauses: TypescriptImport[] = [...importClauses];

    if (options.getGroupByPath()) {
        importClauses = groupByPath(importClauses);
    }

    importClauses = importClauses
        .map(importClause => {
            if (importClause.namedImports) {
                importClause.namedImports.sort((a, b) => a.importName.localeCompare(b.importName, 'en', { sensitivity: 'base' }));
            }
            return importClause;
        })
        .sort(compareImportClauses);

    if (options.getUseEmptyLineBetweenBlocks()) {
        removeClauses = includeExistingLinesBetweenImports(removeClauses);
        const expanded = insertEmptyLinesBetweenBlocks(importClauses);
        return { removeClauses, importClauses: expanded };
    }

    return { removeClauses, importClauses};
}

function includeExistingLinesBetweenImports(clauses: TypescriptImport[]): TypescriptImport[] {
    const expanded: TypescriptImport[] = [];
    if (clauses && clauses.length) {
        for (let i = 0; i < clauses.length - 1; i++) {
            expanded.push(clauses[i]);
            const linesBetween = clauses[i + 1].range.start.line - clauses[i].range.end.line;
            if (linesBetween) {
                const start = new vscode.Position(clauses[i].range.end.line, 0);
                const end = new vscode.Position(clauses[i].range.end.line + linesBetween, 0);
                const range: vscode.Range = new vscode.Range(start, end);
                expanded.push({ range } as any);
            }
        }
        expanded.push(clauses[clauses.length - 1]);
    }
    return expanded;
}

function insertEmptyLinesBetweenBlocks(importClauses: TypescriptImport[]): TypescriptImport[] {
    if (importClauses.length) {
        const expanded: TypescriptImport[] = [];
        let currentPriority: number = importClauses[0].priority;
        for (let i = 0; i < importClauses.length; i++) {
            if (importClauses[i].priority !== currentPriority
                && i !== importClauses.length - 1) {
                expanded.push({} as any);
                currentPriority = importClauses[i].priority;
            }
            expanded.push(importClauses[i]);
        }
        return expanded;
    }
    return [];
}

function groupByPath(importClauses: TypescriptImport[]): TypescriptImport[] {
    const groupedImports: TypescriptImport[] = [];
    importClauses.forEach(item => {
        const found = groupedImports.find(i => i.path === item.path);
        if (!found) {
            groupedImports.push(item);
        } else {
            found.namedImports.push(...item.namedImports);
        }
    });
    return groupedImports;
}

function compareImportClauses(a: TypescriptImport, b: TypescriptImport) {
    if (options.getSortOption() === 'path') {
        return comparePath(a, b)
            || compareCaseInsensitive(a.path, b.path);
    } else if (options.getSortOption() === 'regex') {
        return compareRegex(a, b)
            || compareCaseInsensitive(a.path, b.path)
    } else {
        return compareImportType(a, b)
            || (a.namespace && compareCaseInsensitive(a.namespace, b.namespace))
            || (a.default && compareCaseInsensitive(a.default, b.default))
            || (a.namedImports && compareCaseInsensitive(a.namedImports[0].importName, b.namedImports[0].importName))
            || comparePath(a, b);
    }
}

function compareCaseInsensitive(a: string, b: string) {
    return a.localeCompare(b, 'en', { sensitivity: 'base' });
}

function comparePath(a: TypescriptImport, b: TypescriptImport) {
    a.priority = getPathPriority(a.path);
    b.priority = getPathPriority(b.path);
    return a.priority - b.priority;
}

function compareRegex(a: TypescriptImport, b: TypescriptImport) {
    a.priority = getRegexPriority(a.path);
    b.priority = getRegexPriority(b.path);
    return a.priority - b.priority;
}

function getPathPriority(path: string) {
    let sortOrder = options.getPathSortOrdering();
    if (/^\.\//.test(path)) {
        return sortOrder.indexOf('relativeDownLevel');
    } else if (/^\.\.\//.test(path)) {
        return sortOrder.indexOf('relativeUpLevel');
    } else {
        return sortOrder.indexOf('package');
    }
}

function getRegexPriority(path: string): number {
    const sortOrders = options.getRegexSortOrdering();
    for (let i = 0; i < sortOrders.length; i++) {
        const regex = new RegExp(sortOrders[i].expression);
        if (regex.test(path)) {
            return sortOrders[i].priority
        }
    }
    return 1000000;
}

function compareImportType(a: TypescriptImport, b: TypescriptImport) {
    return getImportTypePriority(a) - getImportTypePriority(b);
}

function getImportTypePriority(importClause: TypescriptImport) {
    if (importClause.namespace) {
        return 0;
    } else if (importClause.default) {
        return 1;
    } else if (importClause.namedImports) {
        return 2;
    } else {
        return 3;
    }
}