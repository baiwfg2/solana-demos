import { DashboardFeature } from '@/components/dashboard/dashboard-feature'

/*
只有 app/ 目录下的 page.tsx 文件才会成为路由页面
components/ 目录纯粹用于存放可复用组件
页面通过 import 引入需要的组件
所以入口是 app/ 目录下的各个 page.tsx 文件，而不是 components/ 下的组件。
*/

export default function Home() {
  return <DashboardFeature />
}
