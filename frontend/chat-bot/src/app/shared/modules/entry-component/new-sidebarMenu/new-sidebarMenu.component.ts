import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-sidebarMenu',
  templateUrl: './new-sidebarMenu.component.html',
  styleUrls: ['./new-sidebarMenu.component.scss'],
  standalone: false
})
export class NewSidebarMenuComponent implements OnDestroy {
  private menuItems: any[] = [];
  private permissionMenus: any[] = [];
  private routerSubscription: Subscription;

  @Input()
  set menu(value: any[]) {
    this.menuItems = value || [];
  }

  get menu(): any[] {
    return this.menuItems;
  }
  @Input() menuOpen = false;
  @Input() existPrivateUser = false;
  @Input() selectedAction = false;
  @Input() selectedMenuId: any = null;
  @Input() profileMenu: any;
  @Input() currentYear: number;
  @Input() userName: string;
  @Input() user: string;
  @Input() menuClickedCode: any[] = [];
  @Input() menuCode: any = null;

  @Output() menuSelect = new EventEmitter<{ menu: any; parentId: any }>();
  @Output() menuDetailsSelect = new EventEmitter<any>();
  @Output() closeMenuPanel = new EventEmitter<void>();

  mouseOvermenu: any = null;
  hoveredMenuId: any = null;

  constructor(private readonly router: Router) {
    const permission = JSON.parse(localStorage.getItem('permission') || 'null');
    this.permissionMenus = permission?.menuItems || [];
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd && this.selectedAction) {
        this.closeMenuPanel.emit();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  selectMenu(menu: any, parentId: any = null): void {
    this.menuSelect.emit({ menu, parentId });
  }

  selectLinkedMenu(menu: any): void {
    if (this.hasChildMenus(menu)) {
      this.selectMenu({ ...menu, link: null }, null);
      return;
    }

    this.selectMenu(menu, null);
    this.menuDetailsSelect.emit(menu);
  }

  isSubmenuOpen(menulist: any): boolean {
    return this.menuCode === menulist?.code && !!this.menuClickedCode?.length && this.hasChildMenus(menulist);
  }

  isProfileMenuOpen(): boolean {
    return this.menuCode === this.profileMenu?.code && !!this.menuClickedCode?.length;
  }

  hasChildMenus(menu: any): boolean {
    const permissionMenu = this.permissionMenus.find((item) => item.code === menu?.code);
    return !!permissionMenu?.subMenus?.length || menu?.link === null;
  }

  menuonHover(menuInfo: any | null): void {
    this.mouseOvermenu = menuInfo ? menuInfo.id : null;
  }

  onHoverMenu(menuId: any | null): void {
    this.hoveredMenuId = menuId;
  }

  handleImgError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/Menus/transperant.jpg';
  }

  fixClick(): void {
    console.log('');
  }
}
