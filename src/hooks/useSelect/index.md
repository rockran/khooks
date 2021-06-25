
## useSelect

Demo:

```tsx
import React,{ useEffect } from 'react';
import { Select } from 'antd'
import { useSelect } from 'rhooks'

const api = ()=>{
  return Promise.resolve({
    data:[
      {label:'下拉一',value:'1'}
    ]
  })
}


export default ()=>{
  const select = useSelect(api,{
    
  })

  useEffect(()=>{
    select.search()
  },[])

  return <Select style={{ width: 200 }} {...select.props}></Select>
}

```

