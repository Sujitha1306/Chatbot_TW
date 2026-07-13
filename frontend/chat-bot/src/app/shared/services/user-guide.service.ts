import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class UserGuideService {
    config = null;
    url = null;

    constructor(private toastr: ToastrService) { }

    openHelpUrl(): void {
        const guide = localStorage.getItem('help_config');
        const user_guide = (atob(guide));
        this.config = JSON.parse(user_guide);
        const currentMenu = JSON.parse(localStorage.getItem('currentMenu'));
        let menu = localStorage.getItem('user_guide_menu_code');
        if(!menu.includes(currentMenu[0].code)) {
            localStorage.setItem('user_guide_menu_code', currentMenu[0].code);
            menu = currentMenu[0].code;
        }
        if (this.config !== null && this.config?.hasOwnProperty('page')) {
            if (this.config?.page.hasOwnProperty(menu)) {
                this.url = this.config?.page[menu]
                window.open(this.url, '_blank');
            } else {
                this.url = null;
                this.toastr.warning('Warning', `Page Not Available`);
            }
        }
    }
}
