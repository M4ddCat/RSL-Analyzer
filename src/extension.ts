import * as path from 'path';
import * as vscode from 'vscode'; // <-- Убедись, что импортировал vscode
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
    const serverPath = context.asAbsolutePath(
        path.join('bin', process.platform === 'win32' ? 'rsl-language-server.exe' : 'rsl-lsp')
    );

    const serverOptions: ServerOptions = {
        run: { command: serverPath },
        debug: { command: serverPath }
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'rsl' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{mac,MAC}')
        }
    };

    // ==========================================
    // НОВЫЙ КОД: Команда-мост для CodeLens
    // ==========================================
    const showRefCommand = vscode.commands.registerCommand('rsl.showReferences', (uriStr: string, position: any, locations: any[]) => {
        // Превращаем сырой JSON в строгие объекты VS Code
        const uri = vscode.Uri.parse(uriStr);
        const pos = new vscode.Position(position.line, position.character);
        const locs = locations.map(loc => new vscode.Location(
            vscode.Uri.parse(loc.uri),
            new vscode.Range(
                loc.line !== undefined ? loc.line : loc.range.start.line, 
                loc.character !== undefined ? loc.character : loc.range.start.character, 
                loc.line !== undefined ? loc.line : loc.range.end.line, 
                loc.character !== undefined ? loc.character : loc.range.end.character
            )
        ));

        // Вызываем системную команду с правильными типами
        vscode.commands.executeCommand('editor.action.showReferences', uri, pos, locs);
    });
    
    // Регистрируем команду в контексте расширения
    context.subscriptions.push(showRefCommand);
    // ==========================================

    client = new LanguageClient(
        'rslLanguageServer',
        'RSL Language Server',
        serverOptions,
        clientOptions
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}