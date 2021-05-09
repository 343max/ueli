import { BrowserWindow } from "electron";
import { join } from "path";
import { IpcChannel } from "../common/IpcChannel";

export class WindowManager {
    private readonly mainHtmlFilePath = join(__dirname, "..", "views", "main.html");
    private readonly settingsHtmlFilePath = join(__dirname, "..", "views", "settings.html");
    private readonly preloadJsFilePath = join(__dirname, "Preload.js");

    private mainWindow?: BrowserWindow;
    private settingsWindow?: BrowserWindow;

    public createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            frame: false,
            fullscreen: false,
            height: 500,
            show: false,
            transparent: true,
            webPreferences: {
                preload: this.preloadJsFilePath,
                spellcheck: false,
            },
            width: 600,
        });

        this.mainWindow.loadFile(this.mainHtmlFilePath);
        // this.mainWindow.on("blur", () => this.hideMainWindow());
    }

    public createSettingsWindow(): void {
        this.settingsWindow = new BrowserWindow({
            webPreferences: {
                preload: this.preloadJsFilePath,
                spellcheck: false,
            },
        });

        this.settingsWindow.setMenuBarVisibility(false);
        this.settingsWindow.loadFile(this.settingsHtmlFilePath);
    }

    public toggleMainWindow(): void {
        this.toggleWindow(this.mainWindow);
    }

    public showMainWindow(): void {
        this.showWindow(this.mainWindow);
    }

    public showSettingsWindow(): void {
        if (!this.settingsWindow || this.settingsWindow.isDestroyed()) {
            this.createSettingsWindow();
        }

        this.showWindow(this.settingsWindow);
    }

    public hideMainWindow(): void {
        this.hideWindow(this.mainWindow);
    }

    public hideSettingsWindow(): void {
        this.hideWindow(this.settingsWindow);
    }

    public toggleSettingsWindow(): void {
        this.toggleWindow(this.settingsWindow);
    }

    private toggleWindow(browserWindow?: BrowserWindow) {
        if (browserWindow && !browserWindow.isDestroyed()) {
            browserWindow.isVisible() ? this.hideWindow(browserWindow) : this.showWindow(browserWindow);
        }
    }

    private showWindow(browserWindow?: BrowserWindow): void {
        if (browserWindow && !browserWindow.isDestroyed()) {
            if (browserWindow.isVisible()) {
                browserWindow.focus();
            } else {
                browserWindow.show();
            }

            this.sendMessageToWindow(browserWindow, IpcChannel.MainWindowShown);
        }
    }

    private hideWindow(browserWindow?: BrowserWindow): void {
        if (browserWindow && !browserWindow.isDestroyed()) {
            browserWindow.hide();
        }
    }

    private sendMessageToWindow<ArgumentType>(
        browserWindow: BrowserWindow,
        channel: IpcChannel,
        ...args: ArgumentType[]
    ): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            browserWindow.webContents.send(channel, args);
        }
    }
}
