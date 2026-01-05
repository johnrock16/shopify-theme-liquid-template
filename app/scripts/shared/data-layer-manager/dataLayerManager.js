const DataLayerManager = function (eventTemplate, googleTagManagerConfig) {
  const { titles: GTM_TITLES, types, tags, pages: PAGE_CODES, pathnames: LOCATION_PATHS } = googleTagManagerConfig;

  const GTM_EVENTS = eventTemplate;
  const GTM_TYPES = { ...types, tags };

  const getLocationPathname = () => {
    const pagePath = window.location.pathname.split("/")[1] || "home";
    const pageCode = PAGE_CODES[pagePath] || PAGE_CODES.home;
    const resolver = LOCATION_PATHS[pageCode];
    return typeof resolver === "function" ? resolver() : pagePath;
  };

  function isValidValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }

  function normalizeString(str) {
    if (!str || typeof str !== "string") return "";

    const stringCleaned = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(stringCleaned)) {
      return stringCleaned;
    }
    return stringCleaned.replace(/\s+/g, "-").replace(/[_/]/g, "-").replace(/[^a-z0-9-:]/g, "").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
  }

  function deepMergeAndClean(event, template, params = {}) {
    if (Array.isArray(template)) {
      const arrParams = Array.isArray(params) ? params : [];
      return arrParams.map((paramItem, index) => {
        const templateItem = template[index] || template[0] || {};
        return deepMergeAndClean(event, templateItem, paramItem);
      }).filter((item) => item && Object.keys(item).length > 0);
    }

    const result = {};
    for (const key in template) {
      if (key === 'docs') continue;
      const templateValue = template[key];
      let paramValue = params?.[key];

      const isSchemaLeaf = templateValue && typeof templateValue === "object" && !Array.isArray(templateValue) && ("type" in templateValue || "required" in templateValue || "default" in templateValue);

      if (isSchemaLeaf && templateValue.required) {
        if (paramValue === undefined || paramValue === null || (typeof paramValue === "string" && paramValue.trim() === "")) {
          if (templateValue?.default) {
            paramValue = templateValue?.default
          } else {
            throw new Error(`GTM: Missing required field "${key}" for event "${event}"`);
          }
        }
      }

      if (paramValue !== undefined && isSchemaLeaf && templateValue.type) {
        if (typeof paramValue !== templateValue.type) {
          throw new Error(`GTM: Type mismatch for "${key}" in event "${event}". Expected "${templateValue.type}", got "${typeof paramValue}"`);
        }
      }

      if ( templateValue && typeof templateValue === "object" && !Array.isArray(templateValue) && !isSchemaLeaf) {
        const nested = deepMergeAndClean(event, templateValue, paramValue);
        if (nested && Object.keys(nested).length > 0) {
          result[key] = nested;
        }
        continue;
      }

      if (Array.isArray(templateValue)) {
        const cleanedArray = deepMergeAndClean(event, templateValue, paramValue);
        if (cleanedArray && cleanedArray.length > 0) {
          result[key] = cleanedArray;
        }
        continue;
      }

      if (isSchemaLeaf) {
        if (paramValue !== undefined) {
          result[key] = typeof paramValue === "string" ? normalizeString(paramValue) : paramValue;
        } else if (templateValue.default !== undefined) {
          result[key] = templateValue.default;
          continue;
        }
      } else {
        if (isValidValue(paramValue)) {
          result[key] = typeof paramValue === "string" ? normalizeString(paramValue) : paramValue;
        } else if (templateValue !== undefined) {
          if (typeof templateValue !== "object") {
            result[key] = templateValue;
          }
        }
      }
    }
    return result;
  }

  const pushToDataLayer = (eventKey, params = {}) => {
    const template = GTM_EVENTS[eventKey];
    if (!template) {
      console.warn(`GTM: Event "${eventKey}" not found in template.`);
      return;
    }

    try {
      const cleanedEvent = deepMergeAndClean(template.event, template, params);

      cleanedEvent.custom_section ||= getLocationPathname();
      window.dataLayer.push(cleanedEvent);

      return {ok: true , event: cleanedEvent};
    } catch (error) {
      console.error(error);
      return {error: error};
    }
  };

  const trackElementVisibility = (element, threshold = 0.5) => {
    if (!element) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dispatchEvent(new CustomEvent("onScreen:once"));
          obs.unobserve(entry.target);
        }
      });
    },{threshold});

    observer.observe(element);
  };

  return {
    titles: GTM_TITLES,
    types: GTM_TYPES,
    pushToDataLayer,
    trackElementVisibility,
    normalizeString,
    getLocationPathname,
  };
};

export default DataLayerManager;
