import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from '../../../services/common.service';
import { MatDialog } from '@angular/material/dialog';
import { AppToastService } from '../../../services/toaster.service';

@Component({
  selector: 'app-ai-prompt-form',
  templateUrl: './ai-prompt-form.component.html',
  styleUrls: ['./ai-prompt-form.component.scss']
})
export class AIPromptFormComponent {

  public aiPromptForm: FormGroup;
  public loading = false;
  assetTypes: any = [];
  assetCategory: any = [];

  constructor(public form: FormBuilder, private readonly commonService: CommonService, public toastr: AppToastService, public dialog: MatDialog) { };

  ngOnInit(): void {
    this.commonService.getAppTerms('AssetType,AssetCategory').subscribe(res => {
    this.assetTypes = res.results.filter(resFilter => resFilter.groupName === 'AssetType');
    this.assetCategory = res.results.filter(resFilter => resFilter.groupName === 'AssetCategory');
  });
    this.buildForm();
  }

  public buildForm() {
    this.aiPromptForm = this.form.group({
      name: [null, [Validators.required]],
      maintananceType: [null],
      assetManufacturer: [null],
      assetModel: [null],
      assetType: [null],
      assetCategory: [null],
      description: [null],
      enterPrompt: [null, [Validators.maxLength(500)]]
    });
  }

  saveAiPrompt() {
    this.loading = true;
    let postInfo = {
      "name" : this.aiPromptForm.get('name').value,
      "referenceDetail" : {
        "type" : "asset", 
        "maintananceType" : this.aiPromptForm.get('maintananceType').value, 
        "assetType" : this.aiPromptForm.get('assetType').value, 
        "AssetCategory" : this.aiPromptForm.get('assetCategory').value, 
        "minorType": null, 
        "assetDescription" : this.aiPromptForm.get('description').value,
        "assetManufacturer" : this.aiPromptForm.get('assetManufacturer').value,
        "assetModel" : this.aiPromptForm.get('assetModel').value
      },
      "prompt": this.aiPromptForm.get('enterPrompt').value ?? null
    }
    this.commonService.n8ntemplate(postInfo).subscribe(res => {
      this.toastr.success('Success', `${res.message}`);
      this.dialog.closeAll();
      this.loading = false;
    },
      error => {
        this.toastr.error('Error', `${error.error.message}`);
        this.dialog.closeAll();
        this.loading = false;
      });
  }

}
