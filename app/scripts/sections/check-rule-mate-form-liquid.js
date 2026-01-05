import { FormManager } from 'check-rule-mate-form';
import { myValidator } from '../shared/check-rule-mate/validators/validators';

document.addEventListener('DOMContentLoaded', function () {
  const formElements = document.querySelectorAll('.check-rule-mate-form');

  formElements.forEach((formElement) => {
    const formInputs = formElement.querySelectorAll('input, textarea, select');
    const FORM_RULES = JSON.parse(formElement.dataset.rulesForm);
    const RULES = JSON.parse(formElement.dataset.rulesCrmf);
    const ERRORS_MESSAGES = JSON.parse(formElement.dataset.errorsMessages);
    const BREAKPOINT_MD = formElement.dataset.breakpointMd;
    const BREAKPOINT_LG = formElement.dataset.breakpointLg;
    const breakpoints = { md: BREAKPOINT_MD, lg: BREAKPOINT_LG };
    const mask = new Mask(RULES);
    const formManager = new FormManager(formElement, {
      schema: FORM_RULES,
      rules: RULES,
      validationHelpers: myValidator,
      errorMessages: ERRORS_MESSAGES,
      options: { propertiesMustMatch: false, abortEarly: false },
    });

    formManager.addAttributes();
    formInputs.forEach((formInput) => {
      formInput.addEventListener('change', formManager.handleInputChange);
      if (RULES[formInput.dataset.rule]?.mask) {
        formInput.addEventListener('keyup', mask.handleKeyUp);
      }
    });
    formElement.addEventListener('reset', formManager.handleFormReset);
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formValidated = await formManager.handleFormSubmit(e);
      console.log(formValidated);
      if (formValidated.error) {
        alert('form is invalid');
      } else if (formValidated.ok) {
        alert('form is valid');
      }
    });
    window.addEventListener('resize', () => {
      handleFieldsResize(formInputs, breakpoints);
    });
    handleFieldsResize(formInputs, breakpoints);
  });
});

function handleFieldsResize(formInputs, breakpoints) {
  formInputs.forEach((formInput) => {
    const { fieldWidth, fieldWidthMd, fieldWidthLg } = formInput.dataset;
    const inputWidthBreakpoints = {
      sm: fieldWidth,
      md: fieldWidthMd,
      lg: fieldWidthLg,
    };
    let currentBreakpoint = 'sm';
    Object.keys(breakpoints).forEach((key) => {
      if (window.innerWidth > breakpoints[key]) {
        currentBreakpoint = key;
      }
    });
    formInput.closest('.crmf-field').style.width =
      inputWidthBreakpoints[currentBreakpoint] !== '100%'
        ? `calc(${inputWidthBreakpoints[currentBreakpoint]} - 8px)`
        : inputWidthBreakpoints[currentBreakpoint];
  });
}

function Mask(RULES) {
  function generateTextWithMask(value, maskArray) {
    let textMasked = value;
    maskArray.forEach((mask) => {
      textMasked = textMasked.replace(new RegExp(mask[0]), mask[1]);
    });
    return textMasked;
  }

  function handleKeyUp(e) {
    setTimeout(() => {
      e.target.value = generateTextWithMask(e.target.value, RULES[e.target.dataset.rule].mask);
    }, 400);
  }

  return {
    handleKeyUp: handleKeyUp,
  };
}
