import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MobilescannerComponent } from '../../../../../ovitag/configuration/mobilescanner/mobilescanner.component';
import { CommonService } from '../../../../services';
import { Router } from '@angular/router';
import { AppToastService } from '../../../../services/toaster.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-pwa-patient',
  templateUrl: './pwa-patient.component.html',
  styleUrls: ['./pwa-patient.component.scss']
})
export class PwaPatientComponent {

  public patientForm: any = FormGroup;

  public userName: any = null;

  public activeView: any = 'list';

  public isLoading: boolean = false;

  public assetList: any[] = [];
  public listViewData: any[] = [];

  constructor(public fb: FormBuilder, public dialog: MatDialog, public commonService: CommonService, public router: Router, public toastr: AppToastService,
              public datePipe: DatePipe) {
    this.userName = localStorage.getItem('Y3VycmVudF91c2Vy');
  }

  ngOnInit(): void {
    this.getEntityBookingPatient();
    this.getAssetData();
    this.buildForm();
  }

  buildForm() {
    this.patientForm = this.fb.group({
      patientName: [null, Validators.required],
      patientMRN: [null],
      wheelchairId: [null, Validators.required],
      mobileNo: [null, [Validators.pattern(/(^[0-9]{10}$)/)]]
    })
  }

  getEntityBookingPatient() {
    this.isLoading = true;
    let userId = localStorage.getItem('dXNlcklk');
    let date = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.commonService.getEntitybookingPatinet(userId, date).subscribe(res => {
      this.isLoading = false;
      if (res.statusCode === 1) {
        this.listViewData = res.results;
      }
    })
  }

  qrScan() {
    const dialogRef = this.dialog.open(MobilescannerComponent, {
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
      maxWidth: 'none',
      data: { mode: 'dialog' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let aid = result?.params?.aid;
        if (aid) {
          this.commonService.getAssetlist('AT-WH', aid).subscribe(res => {
            if (res.statusCode === 1) {
              const assetData = res.results[0];
              this.patientForm.get('wheelchairId').setValue(assetData?.assetId);
            }
          });
        }
      }
    })
  }

  getAssetData() {
    this.isLoading = true;
    this.commonService.getAssetlist('AT-WH').subscribe(res => {
      this.isLoading = false;
      if (res.statusCode === 1) {
        this.assetList = res.results.map(rse => ({ ...rse, value: rse.assetName, code: rse.assetId }));
      }
    })
  }

  logout() {
    this.userName = '';
    const lang = localStorage.getItem(btoa('locale'))
    const enabledCookie = localStorage.hasOwnProperty('cookiesAccepted') ? localStorage.getItem('cookiesAccepted') : 'false';
    localStorage.clear();
    localStorage.setItem(btoa('locale'), lang)
    localStorage.setItem('cookiesAccepted', enabledCookie)
    this.router.navigate(['/login']);
  }

  setView(view: string) {
    this.activeView = view;
  }

  patientchairRequest() {
    const assetInfo = this.assetList.find(x => x.code === this.patientForm.get('wheelchairId').value);
    let createWheelChairREQ = {
      'identifyingId': null,
      'identifyingType': 'Patient',
      'identifyingValue': this.patientForm.get('patientName').value ?? null,
      'entityId': assetInfo?.assetId ?? null,
      'entityType': 'Asset',
      'entityName': assetInfo?.assetName ?? null,
      'uhid': this.patientForm.get('patientMRN').value ?? null,
      'mobileNumber': this.patientForm.get('mobileNo').value ?? null
    }
    // console.log(createWheelChairREQ);
    // return
    this.commonService.saveEntityPatient(createWheelChairREQ).subscribe({
      next: (res) => {
        this.toastr.success('Success', 'Wheel Chair Booking successfully');
        this.activeView = 'list';
        this.patientForm.reset();
        this.getEntityBookingPatient();
      },
      error: (err) => {
        this.toastr.error('Error', `${err.error.message}`);
      }
    });
  }

  patientchairReceived(event) {
    if (event) {
      let receivedWheelChairREQ = {
        'entityBookingId': event.id,
        'bookingStatusId': 'BK-CMP',
        'entityId': event.entityId,
        'entityType': 'Asset'
      }
      this.commonService.cancelBreak(receivedWheelChairREQ).subscribe({
        next: (res) => {
          this.toastr.success('Success', 'Wheel Chair Returned successfully');
          this.activeView = 'list';
          this.getEntityBookingPatient();
        },
        error: (err) => {
          this.toastr.error('Error', `${err.error.message}`);
        }
      });
    }
  }
}
