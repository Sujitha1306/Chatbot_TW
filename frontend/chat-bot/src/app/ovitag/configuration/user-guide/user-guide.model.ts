export class CreateUserGuide {
  constructor(
    public resourceType: string,
    public resourceCode: string,
    public title: string,
    public url: string,
    public documentTypeId?: string,
    public attachment?: string,
    public fileName?: string,
    public fileType?: string,
    public status?: boolean,
    public preferedLanguage?: string,
    public description?: string,
    public id?: number,
  ) {}
}
