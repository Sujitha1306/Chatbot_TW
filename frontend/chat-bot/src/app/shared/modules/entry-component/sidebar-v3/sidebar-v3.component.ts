import {
  Component, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild, ElementRef, HostListener
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonService } from '../../..';

@Component({
  selector: 'app-sidebar-v3',
  templateUrl: './sidebar-v3.component.html',
  styleUrls: ['./sidebar-v3.component.scss'],
  standalone: false
})
export class SidebarV3Component implements OnInit, OnDestroy {
  private menuItems: any[] = [];
  private permissionMenus: any[] = [];
  private routerSubscription: Subscription;

  @Input()
  set menu(value: any[]) {
    this.menuItems = value || [];
    this.applyMenuOrder();
    this.rebuildFavorites();
  }
  get menu(): any[] { return this.menuItems; }

  @Input() menuOpen = false;
  @Input() existPrivateUser = false;
  @Input() selectedMenuId: any = null;
  @Input() profileMenu: any;
  @Input() currentYear: number;
  @Input() userName: string;
  @Input() user: string;
  @Input() menuClickedCode: any[] = [];
  @Input() menuCode: any = null;
  // Collapsed (icon-only) state is driven by the top-left logo via the parent.
  @Input()
  set iconOnlyMode(value: boolean) {
    this._iconOnlyMode = value;
    this.flyoutItem = null;
  }
  get iconOnlyMode(): boolean { return this._iconOnlyMode; }
  private _iconOnlyMode = false;

  @Output() menuSelect = new EventEmitter<{ menu: any; parentId: any }>();
  @Output() menuDetailsSelect = new EventEmitter<any>();
  @Output() closeMenuPanel = new EventEmitter<void>();

  @ViewChild('searchInput') searchInputRef: ElementRef;

  private _searchQuery = '';
  set searchQuery(value: string) {
    this._searchQuery = value || '';
    this.rebuildSearch();
  }
  get searchQuery(): string { return this._searchQuery; }

  // Flat search results across all 3 menu levels — STABLE array, rebuilt only on query change.
  searchResults: any[] = [];

  hoveredMenuId: any = null;

  // Menu Preference section collapse (collapsed by default)
  prefCollapsed = true;

  // Custom menu order
  menuOrder: string[] = [];
  orderedMenuItems: any[] = [];

  // Per-parent submenu order { parentCode: [subCode, ...] } — covers 2nd & 3rd level
  subMenuOrder: { [code: string]: string[] } = {};

  favoritesCollapsed = false;

  // Favorites: child (submenu) nodes, plus top-level items that have NO children.
  private favoritesCodes: Set<string> = new Set();
  favSubCodes: Set<string> = new Set();
  favSubCodesArray: string[] = [];

  // Precomputed favorite views — STABLE references, only rebuilt when favorites change.
  // Never compute these inside the template (causes change-detection thrash / hang).
  favoriteMainItems: any[] = [];
  favoriteGroups: Array<{ parent: any; subs: any[] }> = [];

  // Profile avatar image (shown instead of initials once the user has uploaded one)
  profileImage: SafeResourceUrl | null = null;

  // Theme
  isDarkTheme = false;

  // Menu preferences (v3-only, persisted)
  showFavoritesSection = true;
  showSearchBar = true;

  // Theme colours (Angular primary / secondary) — shown & editable in Menu Preference
  primaryColor = '#28a59f';
  secondaryColor = '#62d9d3';

  // Hover flyout (used in collapsed/icon-only mode)
  flyoutItem: any = null;
  flyoutSubs: any[] = [];
  flyoutTop = 0;
  flyoutLeft = 0;
  private closeTimer: any = null;
  expandedFlyoutSubCode: string | null = null;
  flyoutSubChildrenMap: { [code: string]: any[] } = {};

  getFlyoutChildren(subCode: string): any[] {
    return this.flyoutSubChildrenMap[subCode] || [];
  }

  get flyoutLevel2Subs(): any[] {
    return this.flyoutSubs.filter(s => s._level === 2);
  }

  get initials(): string {
    if (!this.userName || this.userName === 'null' || this.userName === 'undefined') {
      return 'U';
    }
    const nameStr = String(this.userName).trim();
    if (!nameStr) {
      return 'U';
    }
    const parts = nameStr.split(/\s+/)
      .filter(p => p && p !== 'null' && p !== 'undefined');
    if (parts.length === 0) {
      return 'U';
    }
    if (parts.length >= 2) {
      const firstInitial = parts[0][0] || '';
      const middleWord = parts[Math.floor(parts.length / 2)];
      const middleInitial = middleWord ? (middleWord[0] || '') : '';
      return (firstInitial + middleInitial).toUpperCase();
    } else {
      const singleWord = parts[0];
      if (singleWord.length >= 2) {
        const firstLetter = singleWord[0];
        const middleLetter = singleWord[Math.floor(singleWord.length / 2)];
        return (firstLetter + middleLetter).toUpperCase();
      } else {
        return singleWord.toUpperCase();
      }
    }
  }

  get hasFavorites(): boolean {
    return this.favoriteMainItems.length > 0 || this.favoriteGroups.length > 0;
  }

  get mainMenuItems(): any[] {
    return this.menuItems.filter(m => m.code !== 'MN_ALL');
  }

  // Browse list (only used when NOT searching) — STABLE ordered array.
  get filteredMenuItems(): any[] {
    return this.orderedMenuItems;
  }

  /** Rebuild orderedMenuItems from menuItems applying the saved custom order. */
  applyMenuOrder(): void {
    const items = this.mainMenuItems;
    if (!this.menuOrder.length) {
      this.orderedMenuItems = items;
      return;
    }
    const byCode = new Map(items.map(m => [m.code, m]));
    const ordered: any[] = [];
    // First, items in saved order (that still exist)
    for (const code of this.menuOrder) {
      const it = byCode.get(code);
      if (it) { ordered.push(it); byCode.delete(code); }
    }
    // Then any new items not yet in the saved order, in their original order
    for (const m of items) {
      if (byCode.has(m.code)) { ordered.push(m); }
    }
    this.orderedMenuItems = ordered;
  }

  dropMenuItem(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) { return; }
    moveItemInArray(this.orderedMenuItems, event.previousIndex, event.currentIndex);
    this.menuOrder = this.orderedMenuItems.map(m => m.code);
    this.savePreferences();
  }

  onSubReorder(event: { parentCode: string; order: string[] }): void {
    this.subMenuOrder[event.parentCode] = event.order;
    this.savePreferences();
  }

  /** Reset to the original menu structure delivered by the API at login. */
  resetMenuStructure(): void {
    this.menuOrder = [];
    this.subMenuOrder = {};
    this.applyMenuOrder();
    this.savePreferences();
  }

  /**
   * Build a flat list of items matching the query across all levels
   * (top-level menu, 2nd-level submenu, 3rd-level sub-submenu).
   * Runs only when the query changes (setter), never inside the template.
   */
  rebuildSearch(): void {
    const q = this._searchQuery.trim().toLowerCase();
    if (!q) { this.searchResults = []; return; }

    const results: any[] = [];
    for (const top of this.menuItems) {
      if (top.code === 'MN_ALL') { continue; }
      const perm = this.permissionMenus.find(p => p.code === top.code);

      if (top.name?.toLowerCase().includes(q)) {
        results.push({
          code: top.code, name: top.name, iconName: top.iconName,
          link: top.link, _level: 1, _ref: top
        });
      }

      for (const sub of (perm?.subMenus || [])) {
        if (sub.name?.toLowerCase().includes(q)) {
          results.push({
            code: sub.code, name: sub.name, iconName: sub.iconName,
            link: sub.link, _level: 2, _parentName: top.name,
            _parentCode: top.code
          });
        }
        for (const ss of (sub.subMenus || [])) {
          if (ss.name?.toLowerCase().includes(q)) {
            results.push({
              code: ss.code, name: ss.name, iconName: ss.iconName,
              link: ss.link, _level: 3,
              _parentName: sub.name,
              _rootParentName: top.name,
              _parentCode: top.code
            });
          }
        }
      }
    }
    this.searchResults = results;
  }

  onSearchResultClick(res: any): void {
    // Parent menu with no direct link — clear search and open it in browse mode.
    if (res._level === 1 && !res.link) {
      this.clearSearch();
      this.selectLinkedMenu(res._ref);
    }
    // Items with a link navigate via routerLink; nothing else needed.
  }

  /**
   * Recompute the favorites views into stable arrays. Called only when the
   * underlying favorite sets or the menu input actually change — NEVER from the
   * template. Building new object refs every change-detection cycle (as a getter
   * would) tears down/rebuilds matTooltip + routerLinkActive each pass and sends
   * change detection into an unsettleable loop (UI hang).
   */
  rebuildFavorites(): void {
    // Favorited top-level items — only those WITHOUT children (leaf parents).
    this.favoriteMainItems = this.menuItems.filter(
      m => m.code !== 'MN_ALL' && !this.hasChildMenus(m) && this.favoritesCodes.has(m.code)
    );

    // Favorited child (submenu) nodes — grouped under their parent.
    const groups: Array<{ parent: any; subs: any[] }> = [];
    for (const m of this.menuItems) {
      if (m.code === 'MN_ALL') { continue; }
      const perm = this.permissionMenus.find(p => p.code === m.code);
      if (!perm?.subMenus?.length) { continue; }

      const subs: any[] = [];
      for (const sub of perm.subMenus) {
        if (this.favSubCodes.has(sub.code)) {
          subs.push({ ...sub, _level: 2, _parentName: m.name });
        }
        for (const ss of (sub.subMenus || [])) {
          if (this.favSubCodes.has(ss.code)) {
            subs.push({ ...ss, _level: 3, _parentName: m.name, _subParentName: sub.name });
          }
        }
      }
      if (subs.length) {
        groups.push({ parent: m, subs });
      }
    }
    this.favoriteGroups = groups;
  }

  isFavorite(code: string): boolean { return this.favoritesCodes.has(code); }

  toggleFavorite(code: string, event: Event): void {
    event.stopPropagation();
    if (this.favoritesCodes.has(code)) {
      this.favoritesCodes.delete(code);
    } else {
      this.favoritesCodes.add(code);
    }
    this.rebuildFavorites();
    this.savePreferences();
    if (this.flyoutItem?.code === 'MN_FAV') {
      this.rebuildFavoritesFlyout();
    }
  }

  toggleSubFavorite(event: { subCode: string; parentCode: string }): void {
    if (this.favSubCodes.has(event.subCode)) {
      this.favSubCodes.delete(event.subCode);
    } else {
      this.favSubCodes.add(event.subCode);
    }
    this.favSubCodesArray = [...this.favSubCodes];
    this.rebuildFavorites();
    this.savePreferences('isFav');
    if (this.flyoutItem?.code === 'MN_FAV') {
      this.rebuildFavoritesFlyout();
    }
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.savePreferences();
  }

  private readCssVar(name: string): string {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch { return ''; }
  }

  togglePrefCollapsed(event?: Event): void {
    event?.stopPropagation();
    this.prefCollapsed = !this.prefCollapsed;
    this.savePreferences();
  }

  toggleShowFavorites(): void {
    this.showFavoritesSection = !this.showFavoritesSection;
    this.savePreferences();
  }

  toggleShowSearch(): void {
    this.showSearchBar = !this.showSearchBar;
    if (!this.showSearchBar) { this.clearSearch(); }
    this.savePreferences();
  }

  // Build the submenu list for the hover flyout (2nd + 3rd level), stable per open.
  private buildFlyoutSubs(parentCode: string): any[] {
    const perm = this.permissionMenus.find(p => p.code === parentCode);
    const out: any[] = [];
    this.flyoutSubChildrenMap = {};
    for (const sub of (perm?.subMenus || [])) {
      out.push({
        code: sub.code, name: sub.name, iconName: sub.iconName,
        link: sub.link, _level: 2
      });
      const children: any[] = [];
      for (const ss of (sub.subMenus || [])) {
        children.push({
          code: ss.code, name: ss.name, iconName: ss.iconName,
          link: ss.link, _level: 3, _parentName: sub.name, _parentCode: sub.code
        });
      }
      if (children.length) {
        this.flyoutSubChildrenMap[sub.code] = children;
      }
      out.push(...children);
    }
    return out;
  }

  openFlyout(item: any, event: MouseEvent): void {
    // In icon-only mode every item gets a flyout: parents show their submenu,
    // leaf items show just their name (as a launchable menu entry).
    if (!this.iconOnlyMode || !item) { return; }
    this.cancelCloseFlyout();
    this.expandedFlyoutSubCode = null;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.flyoutLeft = rect.right;
    this.flyoutItem = item;
    this.flyoutSubs = this.hasChildMenus(item) ? this.buildFlyoutSubs(item.code) : [];

    const currentUrl = this.router.url.split('?')[0];
    for (const [pCode, children] of Object.entries(this.flyoutSubChildrenMap)) {
      if ((children as any[]).some((c: any) => c.link === currentUrl)) {
        this.expandedFlyoutSubCode = pCode;
        break;
      }
    }

    // Vertical placement: align to the hovered row, but if the panel would run
    // past the bottom of the viewport, shift it upward (using the space above
    // the clicked location) so its bottom edge stays visible.
    const margin = 8;
    const viewH = window.innerHeight;
    const titleH = 40;
    const rowH = 36;
    const estHeight = Math.min(titleH + this.flyoutSubs.length * rowH + 12, viewH * 0.8);
    let top = rect.top;
    if (top + estHeight > viewH - margin) {
      top = Math.max(margin, viewH - estHeight - margin);
    }
    if (top > 300 && item.subMenus?.length !== 0) {
      top = top - 100;
    }
    this.flyoutTop = top;
  }

  openFavoritesFlyout(event: MouseEvent): void {
    if (!this.iconOnlyMode) { return; }
    this.cancelCloseFlyout();
    this.expandedFlyoutSubCode = null;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.flyoutLeft = rect.right;
    this.flyoutItem = { code: 'MN_FAV', name: 'FAVORITES' };
    this.flyoutSubChildrenMap = {};
    
    this.rebuildFavoritesFlyout();

    const margin = 8;
    const viewH = window.innerHeight;
    const titleH = 40;
    const rowH = 36;
    const estHeight = Math.min(titleH + this.flyoutSubs.length * rowH + 12, viewH * 0.8);
    let top = rect.top;
    if (top + estHeight > viewH - margin) {
      top = Math.max(margin, viewH - estHeight - margin);
    }
    this.flyoutTop = top;
  }

  rebuildFavoritesFlyout(): void {
    const subs: any[] = [];
    for (const item of this.favoriteMainItems) {
      subs.push({
        code: item.code, name: item.name, iconName: item.iconName,
        link: item.link, _level: 2, _origLevel: 1
      });
    }
    for (const group of this.favoriteGroups) {
      for (const sub of group.subs) {
        subs.push({
          code: sub.code, name: sub.name, iconName: sub.iconName,
          link: sub.link, _level: 2, _origLevel: sub._level,
          _parentName: sub._parentName, _subParentName: sub._subParentName,
          _parentCode: group.parent.code
        });
      }
    }
    this.flyoutSubs = subs;
    if (subs.length === 0) {
      this.closeFlyoutNow();
    }
  }

  /**
   * Click on a collapsed-rail icon. Leaf items launch directly; a parent that
   * resolves to a single launchable item launches it directly; otherwise the
   * hover flyout is used to pick.
   */
  onCollapsedClick(item: any, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.iconOnlyMode) {
      this.selectLinkedMenu(item);
      return;
    }
    if (!this.hasChildMenus(item)) {
      this.closeFlyoutNow();
      this.selectLinkedMenu(item);
      return;
    }
    this.selectMenu({ ...item, link: null }, null);
    const launchable = this.buildFlyoutSubs(item.code).filter(s => s.link);
    if (launchable.length === 1) {
      this.closeFlyoutNow();
      this.router.navigateByUrl(launchable[0].link);
      return;
    }
    this.openFlyout(item, event);
  }

  /** Click on the flyout header — launches the item when it has its own link. */
  flyoutTitleClick(): void {
    if (this.flyoutItem?.link) {
      const item = this.flyoutItem;
      this.closeFlyoutNow();
      this.selectLinkedMenu(item);
      this.router.navigateByUrl(item.link);
    }
  }

  scheduleCloseFlyout(): void {
    this.cancelCloseFlyout();
    this.closeTimer = setTimeout(() => { this.flyoutItem = null; }, 160);
  }

  cancelCloseFlyout(): void {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }

  closeFlyoutNow(): void {
    this.cancelCloseFlyout();
    this.flyoutItem = null;
    this.expandedFlyoutSubCode = null;
  }

  toggleFlyoutSubExpansion(subCode: string): void {
    this.expandedFlyoutSubCode = this.expandedFlyoutSubCode === subCode ? null : subCode;
  }

  onFlyoutSubClick(sub: any): void {
    if (this.getFlyoutChildren(sub.code).length) {
      this.toggleFlyoutSubExpansion(sub.code);
    } else {
      if (sub.link) { this.router.navigateByUrl(sub.link); }
      this.selectMenu(this.flyoutItem, null);
      this.closeFlyoutNow();
    }
  }

  constructor(
    private readonly router: Router,
    public readonly common: CommonService,
    private readonly sanitizer: DomSanitizer
  ) {
    const permission = JSON.parse(localStorage.getItem('permission') || 'null');
    this.permissionMenus = permission?.menuItems || [];
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeMenuPanel.emit();
      }
    });
  }

  ngOnInit(): void {
    this.loadProfileImage();
    this.common.validateUserPreference('menuPreference');

    setTimeout(() => {
      const pref = this.common.userPreference;
      const raw = pref?.hasOwnProperty('menuPreference')
        ? pref['menuPreference'].value
        : localStorage.getItem('menuPreference');

      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

      this.isDarkTheme = data.theme === 'dark';

      // Theme colours shown for reference only (read from the global theme).
      this.primaryColor = this.readCssVar('--primary-bg-color') || '#28a59f';
      this.secondaryColor = this.readCssVar('--primary-menu-bg-color') || '#62d9d3';

      // iconOnly/collapsed is driven by the top-left logo (parent), not persisted here.
      // Default ON — only an explicit false disables these.
      this.showFavoritesSection = data.showFavorites !== false;
      this.showSearchBar = data.showSearch !== false;
      // Default collapsed — only an explicit false expands.
      this.prefCollapsed = data.prefCollapsed !== false;

      this.favoritesCodes = new Set(Array.isArray(data.favMenuCodes) ? data.favMenuCodes : []);
      this.favSubCodes = new Set(Array.isArray(data.favSubMenuCodes) ? data.favSubMenuCodes : []);
      this.favSubCodesArray = [...this.favSubCodes];
      this.menuOrder = Array.isArray(data.menuOrder) ? data.menuOrder : [];
      this.subMenuOrder = (data.subMenuOrder && typeof data.subMenuOrder === 'object') ? data.subMenuOrder : {};

      this.applyMenuOrder();
      this.rebuildFavorites();
    }, 600);
  }

  /** Persist all sidebar preferences as one JSON object under a single key. */
  private savePreferences(key?: string): void {
    const data = {
      theme: this.isDarkTheme ? 'dark' : 'light',
      showFavorites: this.showFavoritesSection,
      showSearch: this.showSearchBar,
      prefCollapsed: this.prefCollapsed,
      favMenuCodes: [...this.favoritesCodes],
      favSubMenuCodes: [...this.favSubCodes],
      menuOrder: this.menuOrder,
      subMenuOrder: this.subMenuOrder,
    };
    const value = JSON.stringify(data);
    if (key == 'isFav') {
      this.common.validateUserPreference('menuPreference', value, false);
    } else {
      this.common.validateUserPreference('menuPreference', value);
      localStorage.setItem('menuPreference', value);
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.cancelCloseFlyout();
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(e: KeyboardEvent): void {
    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      this.searchInputRef?.nativeElement.focus();
    } else if (e.key === 'Escape') {
      this.clearSearch();
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchInputRef?.nativeElement.blur();
  }

  selectMenu(menu: any, parentId: any = null): void {
    this.menuSelect.emit({ menu, parentId });
  }

  selectLinkedMenu(menu: any): void {
    if (this.hasChildMenus(menu)) {
      if (this.isSubmenuOpen(menu)) {
        this.selectMenu(null, null);
      } else {
        this.selectMenu({ ...menu, link: null }, null);
      }
      return;
    }
    this.selectMenu(menu, null);
    this.menuDetailsSelect.emit(menu);
  }

  isSubmenuOpen(menulist: any): boolean {
    return this.menuCode === menulist?.code
      && !!this.menuClickedCode?.length
      && this.hasChildMenus(menulist);
  }

  isProfileMenuOpen(): boolean {
    return this.menuCode === this.profileMenu?.code && !!this.menuClickedCode?.length;
  }

  hasChildMenus(menu: any): boolean {
    const perm = this.permissionMenus.find(item => item.code === menu?.code);
    return !!perm?.subMenus?.length || menu?.link === null;
  }

  handleImgError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/Menus/transperant.jpg';
  }

  private loadProfileImage(): void {
    this.common.getCurrentUser().subscribe(res => {
      const userId = res?.results?.id;
      if (!userId) { return; }
      this.common.getUserLocationById(userId).subscribe(userRes => {
        const imageUrl = userRes?.results?.imageUrl;
        this.profileImage = imageUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(imageUrl) : null;
      });
    });
  }

  handleAvatarImgError(): void {
    this.profileImage = null;
  }

  trackByCode(_index: number, item: any): any { return item?.code ?? _index; }

  trackByGroup(_index: number, group: any): any { return group?.parent?.code ?? _index; }

  fixClick(): void { }
}
