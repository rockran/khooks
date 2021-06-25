import { useState } from 'react';

/**
 * @param {*} api
 * @param {*} formatOption  参数三 用于解耦服务端字段
 *
 * @param {*} antdSelectProps
 */

export const useSelect = (api, formatOptions = {}, antdSelectProps = {}) => {
  if (typeof api !== 'function') {
    return antdSelectProps;
  }

  const { label = 'label', value = 'value', all = true } = formatOptions;

  let defaultOptions = [];
  if (all) {
    defaultOptions = [{ label: '全部', value: '' }];
  }

  const [options, setOptions] = useState(defaultOptions);

  function getData(params = {}) {
    if (typeof api !== 'function') return Promise.resolve();
    return api(params).then((res) => {
      const options = (res.data || []).map((n) => {
        return {
          label: n[label],
          value: n[value],
        };
      });

      setOptions([...defaultOptions, ...options]);
      return res;
    });
  }

  return {
    props: {
      ...antdSelectProps,
      options,
    },
    search: getData,
  };
};
