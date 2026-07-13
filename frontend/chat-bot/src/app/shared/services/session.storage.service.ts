import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  public attachFiles = [];
  public saveIdentifier = [];
  public updateIdentifier = [];

  constructor() { }

  //for Documents
  setAttachFiles(data){ // updates the latest data to service
    this.attachFiles =data;
  }

  getAttachFiles(){ // get call for latest Data from service
    return this.attachFiles;
  }

  deleteAttachFiles(){ // attachfiles is set to empty array
    this.attachFiles = [];
  }

  // for Identifiers
  setIdentifier(saveData,updateData){//update the latest identifier data to service
    this.saveIdentifier = saveData;
    this.updateIdentifier = updateData;
  }

  getIdentifier(){ // return the latest identifier data
      return {
        saveIdentifier: this.saveIdentifier,
        updateIdentifier: this.updateIdentifier
      };    
  }

  deleteIdentifier(){ // delete the existing identifier data
    this.saveIdentifier=[];
    this.updateIdentifier=[];
  }
}
