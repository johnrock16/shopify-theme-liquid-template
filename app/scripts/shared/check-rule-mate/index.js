import { createValidator } from "check-rule-mate";
import { myValidator } from './validators/validators.js';
import MY_RULES from './rules/myValidatorRules.json' with { type: 'json' };
import CONTACT_US from './schemas/contactUs.json' with { type: 'json' };
import MY_VALIDATION_ERROR_MESSAGES from './errors/en_US/myValidatorRules.json' with { type: 'json' };

const fieldsWorking = {
    "name": "John",
    "lastName": "Doe",
    "email": "email@email.com",
    "emailConfirm": "email@email.com",
    "phone": "",
    "subject": "I need a coffe",
    "message": "Give me coffe"
}

const fieldsNotWorking = {
    "name": "",
    "lastName": "",
    "email": "",
    "emailConfirm": "emailemail.com",
    "phone": "0000-0000",
    "subject": "",
    "message": ""
}

async function test() {
    const validatorWithWrongData = createValidator(fieldsNotWorking, {validationHelpers: myValidator, rules: MY_RULES, schema: CONTACT_US, errorMessages: MY_VALIDATION_ERROR_MESSAGES});
    const validatorWrongDataWIthoutErrorMessageAndAbortEarly = createValidator(fieldsNotWorking, {validationHelpers: myValidator, rules: MY_RULES, schema: CONTACT_US, options: { propertiesMustMatch: true, abortEarly: true}});
    const validatorDataCorrectly = createValidator(fieldsWorking, {validationHelpers: myValidator, rules: MY_RULES, schema: CONTACT_US, errorMessages: MY_VALIDATION_ERROR_MESSAGES, options: { propertiesMustMatch: true},
        hooks: {
            onValidateStart: ({ data }) => {
                // console.log(data);
            },
            onValidateFieldStart: ({ field, value, schemaField }) => {
                // console.log({ field, value, schemaField })
            },
            onValidateFieldError: ({ field, value, schemaField, error }) => {
                // console.log({ field, value, schemaField, error });
            },
            onValidateFieldSuccess: ({ field, value, schemaField }) => {
                // console.log({ field, value, schemaField })
            },
            onValidateEnd: ({ data, errors }) => {
                // console.log({ data, errors });
            }
        }
    });


    console.log('validatorWithWrongData', await validatorWithWrongData.validate());
    console.log('validatorWrongDataWIthoutErrorMessageAndAbortEarly', await validatorWrongDataWIthoutErrorMessageAndAbortEarly.validate());


    validatorDataCorrectly.setData(fieldsWorking);
    console.log('validatorDataCorrectly', await validatorDataCorrectly.validate());
}

test();

