
## useTable

Demo:

```tsx
import React from 'react';
import {Table} from 'antd'
import { useTable } from 'rhooks'

export default ()=>{
  const table = useTable({
    dataSource:[{a:1,id:1}],
    rowKey:'id',
    columns:[{title:"xx",dataIndex:'a'}]
  })
  return <Table  {...table.props}></Table>
}

```

