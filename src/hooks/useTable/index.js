import { useReducer } from 'react';

/**
 * @description
 * @param {*} api 请求表格数据的 ajax 函数  非必填
 * @param {*} antdTableProps  同 antd Table 的配置项一致
 *                     扩展点： rowSelection 配置中 多了 cross 勾选是否支持翻页勾选
 *                     修改点： rowSelection 配置中 selectedRowKeys 改为 selectedRows
 *                                               即：[1,2]  => [{rowKey:1},{rowKey:2}]
 */

const TABLE_DEFAULT = {
  bordered: true,
};

const DEFAULT_PAGE = {
  pageSize: 10,
  current: 1,
};
export const useTable = (api, antdTableProps = {}) => {
  if (typeof api !== 'function' && typeof api === 'object') {
    antdTableProps = api;
  }

  if (antdTableProps.pagination) {
    antdTableProps.pagination = {
      ...DEFAULT_PAGE,
      ...antdTableProps.pagination,
    };
  }
  const initData = {
    dataSource: antdTableProps.dataSource || [],
    formData: {}, // 记录所有 的入参  formData 包含 _initFormData
    initFormData: {}, // 用于记录初始化时 入参
    total: 0,
    selectedRows: antdTableProps.rowSelection?.selectedRowKeys || [], // 注意： 更改了 原有selectedRowKeys string|number 改为 object
  };
  if (antdTableProps.pagination) {
    const page = {
      pageSize: antdTableProps.pagination.pageSize,
      pageNo: antdTableProps.pagination.current,
    };
    initData.formData = { ...page };
    initData.initFormData = { ...page };
  }

  const [state, dispatch] = useReducer(
    (state, newState) => ({ ...state, ...newState }),
    initData,
  );

  // 定义 api 获取服务端数据的方法  这个用申明式函数
  function getData(params) {
    if (typeof api !== 'function')
      return Promise.reject({
        error: 'api is undefined',
      });

    // 过滤空参数
    const _params = { ...params };
    Object.keys(_params).forEach((v) => {
      if (_params[v] !== 0 && !_params[v]) {
        delete _params[v];
      }
    });

    return api(_params).then((res) => {
      dispatch({
        dataSource: res.data || [],
        total: (res.count && Number(res.count)) || 0,
        formData: { ...params },
      });
      return res;
    });
  }

  // 清空 勾选项
  function clearSelectedRows() {
    dispatch({
      selectedRows: [],
    });
  }

  // 点击切页逻辑
  const onPaginationChange = (current, pageSize) => {
    if (!antdTableProps.rowSelection?.cross) {
      clearSelectedRows();
    }
    return getData({
      ...state.formData,
      pageNo: current,
      pageSize: pageSize,
    });
  };

  // 勾选逻辑
  const onSelectedChange = (keys, rows) => {
    const { dataSource, selectedRows } = state;
    const rowKey = antdTableProps.rowKey;

    if (!rowKey) {
      console.error('请在useTable中配置 antdTableProps.rowKey ');
      return;
    }

    const newList = [];
    selectedRows.forEach((i) => {
      const v = dataSource.find((j) => j[rowKey] === i[rowKey]);
      if (!v) {
        newList.push(i);
      }
    });

    dispatch({
      selectedRows: [...newList, ...rows],
    });
  };

  //重置数据  分页(如果有)和查询体条件全部重置，一般用于删除单元数据
  const reset = () => {
    clearSelectedRows();
    return getData(state.initFormData);
  };

  // 保持之前的查询体条件，重新刷新下，一般用于修改单元数据时候
  const refresh = () => {
    return getData(state.formData);
  };

  // 查询
  const search = (data = {}) => {
    let params = null;
    if (state.isInit) {
      clearSelectedRows();
      params = {
        ...state.formData,
        ...state.initFormData, // 第二次以后，这个 initFormData 会有分页+其他 第一次查询的所有条件，这个第一次就是默认初始值
        ...data,
      };
    } else {
      // 这个参数只会执行一次，并且作为初始参数缓存起来
      params = {
        ...data,
        ...state.initFormData,
      };

      dispatch({
        initFormData: params,
        isInit: true,
      });
    }
    return getData(params);
  };

  // 获取勾选项数据
  const getSelected = function (...argu) {
    const { selectedRows } = state;
    if (argu.length === 0) return [...selectedRows];

    if (argu.length === 1) return selectedRows.map((v) => v[argu[0]]);

    return selectedRows.map((n) => {
      const result = {};
      argu.forEach((k) => {
        result[k] = n[k];
      });
      return result;
    });
  };

  // 导出 table 的配置项
  const tableProps = {
    pagination: false,
    ...TABLE_DEFAULT,
    ...antdTableProps,
    dataSource: state.dataSource,
  };
  // 分页配置项
  if (antdTableProps.pagination) {
    tableProps.pagination = {
      showQuickJumper: true,
      showSizeChanger: true,
      showTotal: (total) => `共 ${total} 条`,
      ...antdTableProps.pagination,
      total: state.total,
      current: state.formData.pageNo,
      pageSize: state.formData.pageSize,
      onChange() {
        return onPaginationChange
          .call(null, ...arguments)
          .then((res) =>
            antdTableProps.pagination?.onChange?.call(null, ...arguments, res),
          );
      },

      onShowSizeChange() {
        return onPaginationChange
          .call(null, ...arguments)
          .then((res) =>
            antdTableProps.pagination?.onShowSizeChange?.call(
              null,
              ...arguments,
              res,
            ),
          );
      },
    };
  }

  // 勾选配置项
  if (antdTableProps.rowSelection) {
    tableProps.rowSelection = {
      type: 'checkbox',
      ...antdTableProps.rowSelection,
      selectedRowKeys: state.selectedRows.map((v) => v[antdTableProps.rowKey]),
      onChange(keys, rows) {
        // 解决跨页 勾选 keys 和 rows 不一直的 问题 （antd就有）想来也是  其他页数据都不在dataSource中
        antdTableProps.rowSelection.onChange &&
          antdTableProps.rowSelection.onChange(keys, state.selectedRows);
        return onSelectedChange.call(null, ...arguments);
      },
    };
  }
  return {
    props: tableProps,
    reset,
    refresh,
    search,
    getSelected,
    formData: state.formData,
    initFormData: state.initFormData,
  };
};
