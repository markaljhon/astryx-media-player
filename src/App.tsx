import { Center, TextInput, VStack } from "@astryxdesign/core";
import { AppLayout } from "./layouts/AppLayout";
import { MediaLibraryPage } from "./pages/media/MediaLibraryPage";
import { useState } from "react";

function App() {
  const [password, setPassword] = useState("");
  const DEFAULT_PASSWORD = import.meta.env.VITE_APP_PASSWORD;
  const TEST_PASSWORD = import.meta.env.VITE_TEST_PASSWORD;

  return (
    <AppLayout>
      {password == DEFAULT_PASSWORD ? (
        <MediaLibraryPage providerId="stash" />
      ) : password == TEST_PASSWORD ? (
        <MediaLibraryPage providerId="local" />
      ) : (
        <Center height="100vh">
          <VStack gap={4} width="18rem">
            <TextInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              type="password"
              hasClear={true}
              hasAutoFocus={true}
              size="lg"
            />
          </VStack>
        </Center>
      )}
    </AppLayout>
  );
}

export default App;
