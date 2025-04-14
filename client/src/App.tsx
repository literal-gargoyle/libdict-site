import { Switch, Route } from "wouter";
import Home from "./pages/home";
import MyLibrary from "./pages/my-library";
import CreateDeck from "./pages/create-deck";
import StudyDeck from "./pages/study-deck";
import SignIn from "./pages/sign-in";
import NotFound from "./pages/not-found";
import SharedDeck from "./pages/shared-deck";
import Community from "./pages/community";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";
import ManualEntry from "./pages/manual-entry";
import { AuthProvider } from "./hooks/use-auth";

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/my-library" component={MyLibrary} />
        <Route path="/create" component={CreateDeck} />
        <Route path="/study/:id" component={StudyDeck} />
        <Route path="/analytics/:id" component={Analytics} />
        <Route path="/shared/:id" component={SharedDeck} />
        <Route path="/community" component={Community} />
        <Route path="/settings" component={Settings} />
        <Route path="/manual-entry" component={ManualEntry} />
        <Route path="/manual-entry/:id" component={ManualEntry} />
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

export default App;
