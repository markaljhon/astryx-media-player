import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppShell, Center, TextInput, VStack } from "@astryxdesign/core";
import { useAccess } from "@/features/auth/access";

export const IndexPage = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const {
    getAccessModeForPassword,
    getRouteOptionsForAccessMode,
    setAccessMode,
  } = useAccess();

  useEffect(() => {
    const accessMode = getAccessModeForPassword(password);

    if (!accessMode) {
      return;
    }

    setAccessMode(accessMode);
    void navigate(getRouteOptionsForAccessMode(accessMode));
  }, [
    getAccessModeForPassword,
    getRouteOptionsForAccessMode,
    navigate,
    password,
    setAccessMode,
  ]);

  return (
    <AppShell
      height="fill"
      variant="wash"
      contentPadding={0}
      mobileNav={{ breakpoint: "md" }}
      className="safe-area"
    >
      <Center height="100dvh">
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
    </AppShell>
  );
};
