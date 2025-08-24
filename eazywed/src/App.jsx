import { Suspense } from "react";
import { AuthProvider } from "./context/AuthContext";
import { EstimateProvider } from "./context/EstimateContext";
import AppRoutes from "./routes";
import Loading from "./components/Loading";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <AuthProvider>
      <EstimateProvider>
        <Suspense fallback={<Loading />}>
          <AppRoutes />
        </Suspense>
      </EstimateProvider>
    </AuthProvider>
  );
}

export default App;