import { Route, Routes } from "react-router-dom"
import RouteGuard from "./route-guard"
import BaseLayout from "@/layouts/base-layout"
import { authRoutesPaths, protectedRoutesPaths } from "./routes"
import AppLayout from "@/layouts/app-layout"

const AppRoute= () => {
    return (
        <Routes>
            <Route path="/" element={<RouteGuard requireAuth={false} />}>
                <Route element={<BaseLayout />}>
                {authRoutesPaths?.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
                </Route>
            </Route>

            <Route path="/" element={<RouteGuard requireAuth={true} />}>
                <Route element={<AppLayout />}>
                {protectedRoutesPaths?.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
                </Route>
            </Route>
        </Routes>
    )
}

export default AppRoute;