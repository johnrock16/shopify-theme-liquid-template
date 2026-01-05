import { FormManager } from 'check-rule-mate-form';
import { myValidator } from '../shared/check-rule-mate/validators/validators.js';
import MY_RULES from '../shared/check-rule-mate/rules/myValidatorRules.json' with { type: 'json' };
import CONTACT_US from '../shared/check-rule-mate/schemas/contact-form.json' with { type: 'json' };
import MY_VALIDATION_ERROR_MESSAGES from '../shared/check-rule-mate/errors/en_US/myValidatorRules.json' with { type: 'json' };

const contactFormElement = document.querySelector('#ContactForm');

document.addEventListener('DOMContentLoaded', function () {
  const contactFormInputsElements = contactFormElement.querySelectorAll('input, select, textarea');

  const formManager = new FormManager(contactFormElement, {
    rules: MY_RULES,
    schema: CONTACT_US,
    validationHelpers: myValidator,
    errorMessages: MY_VALIDATION_ERROR_MESSAGES,
    options: { propertiesMustMatch: false, abortEarly: false }
  });

  formManager.addAttributes();

  contactFormInputsElements.forEach((formInput) => formInput.addEventListener('change', formManager.handleInputChange));
  contactFormElement.addEventListener('reset', formManager.handleFormReset);
  contactFormElement.addEventListener('submit', async (e) => {
    const formValidated = await formManager.handleFormSubmit(e);
    console.log(formValidated);
    if (formValidated.error) {
      alert('form is invalid, open the console');
    } else if (formValidated.ok) {
      alert('form is valid, open the console');
    }
  });

  console.log(formManager)
});
