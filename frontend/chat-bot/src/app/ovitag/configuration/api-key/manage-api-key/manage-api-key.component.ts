 import { Component, Inject } from '@angular/core';
 import { FormBuilder, FormGroup } from '@angular/forms';
 import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
 import { ToastrService } from 'ngx-toastr';
 import { ConfigurationService, CommonService, DashboardService } from '../../../../shared';
 import { createapikey } from '../../configuration.model';
import { DatePipe } from '@angular/common';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {Clipboard} from '@angular/cdk/clipboard';


export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-manage-api-key',
  templateUrl: './manage-api-key.component.html',
  styleUrls: ['./manage-api-key.component.scss'],
   providers: [DatePipe,
      { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
})
export class ManageApiKeyComponent {
  public apikeyGroup: FormGroup;
  public createapikey: createapikey;
  facilityList: any;
  public roleList: any[] = null;
 
   constructor(@Inject(MAT_DIALOG_DATA) public data: any, public form: FormBuilder, public toastr: ToastrService, public configurationService: ConfigurationService,
     public thisDialogRef: MatDialogRef<ManageApiKeyComponent>,private readonly clipboard: Clipboard, public dashboardService: DashboardService,public dateformat: DatePipe, private readonly commonService: CommonService,) { }
 
   ngOnInit(): void {
     this.buildForm()
       this.commonService.getCustomerFacilitylist(null, null, 500, 0).subscribe(res => {
      if (res.statusCode === 1) {
        this.facilityList = res.results.map((item: any) => {
          const names = [item.facilityName, item.regionName, item.customerName]
            .filter(x => !!x)
            .join(', ');

          return {
            ...item,
            displayName: names || ''
          };
        });
      }
    });
    this.commonService.getAllRole().subscribe(res => {
        this.roleList = res.results; });
   }
 
  isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
 
  localcopy(value) {
    this.clipboard.copy(value)
  }
  
   public buildForm() {
     let content = this.data ? this.data.content : null;
      content = content ? JSON.stringify(content, undefined, 4) : content;
     this.apikeyGroup = this.form.group({
       keyName: [this.data?.keyName ? this.data.keyName : null],
       facilityId: [this.data?.facilityId ? this.data.facilityId : null],
       keyType: [this.data?.keyType ? this.data.keyType : 'GLOBAL'],
       token: [this.data?.token ? this.data.token : null],
       content: [content],
       status: [this.data ? this.data.status : 'ACTIVE'],
       statusReason: [this.data ? this.data.statusReason : null],
       expiredAt: [this.data ? new Date (this.data.expiredAt) : null],
       roleId:[this.data?.roleId ? this.data.roleId : null]
     });
   }
 
   saveApiKey() {
    const content = JSON.parse(this.apikeyGroup.controls.content.value);
     this.createapikey = new createapikey(null, null, null, null, null, null, null, null, null, null);
     this.createapikey.keyName = this.apikeyGroup.controls['keyName'].value;
     this.createapikey.facilityId = this.apikeyGroup.controls['facilityId'].value;
     this.createapikey.keyType = this.apikeyGroup.controls['keyType'].value;
     this.createapikey.token = this.apikeyGroup.controls['token'].value;
     this.createapikey.content = content;
     this.createapikey.status = this.apikeyGroup.controls['status'].value;
     this.createapikey.statusReason = this.apikeyGroup.controls['statusReason'].value;
     this.createapikey.expiredAt = this.dateformat.transform(this.apikeyGroup.controls['expiredAt'].value, "YYYY-MM-dd HH:mm:ss");
     this.createapikey.roleId = this.apikeyGroup.controls['roleId'].value;
     if (this.data?.id) {
       this.createapikey.id = this.data.id;
     }
     this.configurationService.saveApiKey(this.createapikey).subscribe(result => {
       this.toastr.success('Success', `${result.message}`);
       this.data = result.results
       this.buildForm()
     },
       error => {
         this.toastr.error('Error', `${error.error.message}`);
       });
	   }
}
