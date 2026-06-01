import {
  BrowserWindow,
  clipboard,
  ContextMenuParams,
  Menu,
  MenuItemConstructorOptions,
} from 'electron';
import { EventEmitter } from 'events';
// @ts-ignore: no declaration file
import uuid from 'uuid';
import { openExternal } from './utils/shell';
import { isPackaged } from './utils/env';
import { serializedKeyboardEvent } from './services/services/menu/helpers';

export type ContextMenuContext = {
  webContents?: Electron.WebContents,
  inWebview?: true,
  backForwardState?: {
    canGoBack: boolean,
    canGoForward: boolean,
  },
};

// ⚠️ Because of https://github.com/electron/electron/issues/19424,
// we use a global reference to keep menus alive while they are open and
// prevent the garbage collection.
// See `popup()` for the uuid generation, saving the reference and deleting it afterward
const MENUS = new Map();

export default class ContextMenu extends EventEmitter {

  public props: ContextMenuParams & { misspellingCorrections?: string[] };
  public context: ContextMenuContext;

  constructor(props: ContextMenuParams & { misspellingCorrections?: string[] }, context?: ContextMenuContext) {
    super();
    this.props = props;
    this.context = context || {};
  }

  get menuTemplate() {
    const emit = this.emit.bind(this);
    const props = this.props;

    const { inWebview, webContents, backForwardState } = this.context;

    const emitClikItem = (
      event: Electron.KeyboardEvent,
      action: string,
      args?: any[]
    ) => this.emit('click-item', { event: serializedKeyboardEvent(event), action, args });

    const editFlags = props.editFlags;
    const hasText = props.selectionText.trim().length > 0;
    const can = (type: string) => (editFlags as any)[`can${type}`] && hasText;

    let menuTpl: MenuItemConstructorOptions[] = [
      {
        type: 'separator',
      },
      {
        id: 'cut',
        label: 'Cut',
        // needed because of macOS limitation:
        // https://github.com/electron/electron/issues/5860
        role: can('Cut') ? 'cut' : undefined,
        enabled: can('Cut'),
        visible: props.isEditable,
      },
      {
        id: 'copy',
        label: 'Copy',
        role: can('Copy') ? 'copy' : undefined,
        enabled: can('Copy'),
        visible: props.isEditable || hasText,
      },
      {
        id: 'paste',
        label: 'Paste',
        role: editFlags.canPaste ? 'paste' : undefined,
        enabled: editFlags.canPaste,
        visible: props.isEditable,
      },
      {
        id: 'pasteandmatchstyle',
        label: 'Paste and Match Style',
        // Electron implementation does not work
        // ref: electron/electron#15896
        // role: 'pasteandmatchstyle',
        enabled: editFlags.canPaste,
        visible: props.isEditable,
        click(_menuItem: any, _browserWindow: any, event: any) {
          emitClikItem(event, 'paste-and-match-style');
        },
      },
      {
        type: 'separator',
      },
    ];

    if (props.mediaType === 'image') {
      menuTpl = [
        {
          type: 'separator',
        },
        {
          id: 'save',
          label: 'Save Image',
          visible: inWebview,
          click() {
            if (webContents) {
              webContents.downloadURL(props.srcURL);
            }
          },
        },
        {
          id: 'copyImage',
          label: 'Copy Image to Clipboard',
          click() {
            if (webContents) {
              webContents.copyImageAt(props.x, props.y);
            }
          },
        },
        {
          id: 'copyImageUrl',
          label: 'Copy Image URL',
          click() {
            clipboard.writeText(props.srcURL);
          },
        },
        {
          type: 'separator',
        },
      ];
    }

    if (props.linkURL && props.mediaType === 'none') {
      menuTpl = [
        {
          type: 'separator',
        },
        {
          id: 'copyLink',
          label: 'Copy Link',
          click() {
            clipboard.write({
              bookmark: props.linkText,
              text: props.linkURL,
            });
          },
        },
        {
          id: 'openLinkInNewPage',
          label: 'Open Link In a New Page',
          click(_menuItem: any, _browserWindow: any, event: any) {
            emit('click-item', { event: serializedKeyboardEvent(event), action: 'new-page', args: [props.linkURL] });
          },
        },
        {
          id: 'openLinkInDefaultBrowser',
          label: 'Open Link In Default Browser',
          click() {
            openExternal(props.linkURL);
          },
        },
        {
          type: 'separator',
        },
      ];
    }

    if (inWebview && backForwardState) {
      const { canGoBack, canGoForward } = backForwardState;

      menuTpl.push(
        { type: 'separator' },
        {
          id: 'back',
          label: 'Back',
          enabled: canGoBack,
          click(_menuItem: any, _browserWindow: any, event: any) {
            emitClikItem(event, 'page-go-back');
          },
        },
        {
          id: 'forward',
          label: 'Forward',
          enabled: canGoForward,
          click(_menuItem: any, _browserWindow: any, event: any) {
            emitClikItem(event, 'page-go-forward');
          },
        },
        {
          id: 'reload',
          label: 'Reload',
          click(_menuItem: any, _browserWindow: any, event: any) {
            emitClikItem(event, 'page-reload');
          },
        },
        { type: 'separator' },
        {
          id: 'copyPageURL',
          label: 'Copy Current Page\'s URL',
          click(_menuItem: any, _browserWindow: any, event: any) {
            emitClikItem(event, 'copy-url-to-clipboard');
          },
        },
        { type: 'separator' },
        {
          id: 'reset-current-application',
          label: 'Reset Current Application',
          click(_menuItem: any, _browserWindow: any, event: any) {
            emitClikItem(event, 'reset-current-application');
          },
        },
        { type: 'separator' },
      );
    }

    if (!isPackaged) {
      menuTpl.push(
        { type: 'separator' },
        {
          id: 'inspect',
          label: 'Inspect Element',
          click(_item: any, _browserWindow: any, _event: any) {
            // @ts-ignore: Electron popup window context
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              win.webContents.inspectElement(props.x, props.y);
              if (win.webContents.isDevToolsOpened()) {
                win.webContents.devToolsWebContents?.focus();
              }
            }
          },
        },
        { type: 'separator' }
      );
    }

    if (props.misspellingCorrections && props.misspellingCorrections.length > 0) {
      const { misspellingCorrections } = props;
      menuTpl.unshift({ type: 'separator' });

      misspellingCorrections.reverse().forEach((correction: string) => {
        menuTpl.unshift({
          label: correction,
          click: () => webContents && webContents.replaceMisspelling(correction),
        });
      });
    }

    return delUnusedElements(menuTpl);
  }

  popup(window: BrowserWindow) {
    const menuTemplate = this.menuTemplate;
    if (menuTemplate.length === 0) return;

    const id = uuid.v4();
    // BrowserWindow.fromId
    const menu = Menu.buildFromTemplate(menuTemplate);

    // Save a global references to avoid garbage collection
    // ⚠️ See head of file for details
    MENUS.set(id, menu);

    menu.popup({
      window,
      // Remove the global reference when the menu closes
      callback: () => { MENUS.delete(id); },
    });
  }
}

const delUnusedElements = (menuTpl: MenuItemConstructorOptions[]) => {
  let notDeletedPrevEl: undefined | MenuItemConstructorOptions;
  return menuTpl.filter(el => el.visible !== false).filter((el, i, arr) => {
    const toDelete = el.type === 'separator' && (!notDeletedPrevEl || i === arr.length - 1 || arr[i + 1].type === 'separator');
    notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
    return !toDelete;
  });
};
