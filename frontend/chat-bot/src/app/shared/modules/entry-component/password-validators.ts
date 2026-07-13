import { AbstractControl } from '@angular/forms';
export class PasswordValidation {

    static MatchPassword(AC: AbstractControl) {
        let password = AC.get('newPassword').value;
        if(AC.get('cnfrmNewPassword').touched || AC.get('cnfrmNewPassword').dirty) {
            let verifyPassword = AC.get('cnfrmNewPassword').value;

            if(password != verifyPassword) {
                AC.get('cnfrmNewPassword').setErrors( {MatchPassword: true} )
            } else {
                return null
            }
        }
    }
}