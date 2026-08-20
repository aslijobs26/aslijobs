import { BrowserRouter } from "react-router-dom";
import { OperationsThemeProvider } from "./providers/theme-provider";
import { QueryProvider } from "./providers/query-provider";
import { AppRoutes } from "./routes";

function App() {
  return (
    <OperationsThemeProvider>
      <QueryProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryProvider>
    </OperationsThemeProvider>
  );
}

export default App;
