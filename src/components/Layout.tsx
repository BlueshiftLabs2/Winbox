import { ReactNode, useEffect, useState } from "react";
import { Box, Flex, Button, Heading, Spacer, useColorModeValue } from "@chakra-ui/react";
import { useSession, signOut } from "next-auth/react";
import NextLink from "next/link";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const navBgColor = useColorModeValue("white", "gray.800");
  
  // Add client-side rendering check to prevent hydration errors
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Box minH="100vh" bg={bgColor}>
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding={4}
        bg={navBgColor}
        color="gray.600"
        boxShadow="sm"
      >
        <Flex align="center" mr={5}>
          <NextLink href="/" passHref legacyBehavior>
            <Heading as="a" size="lg" letterSpacing="tight" color="blue.500" cursor="pointer">
              BlueshiftLabs2winbox
            </Heading>
          </NextLink>
        </Flex>

        <Spacer />

        <Box>
          {isClient && (
            <>
              {session ? (
                <Flex align="center">
                  <NextLink href="/dashboard" passHref legacyBehavior>
                    <Button as="a" variant="ghost" mr={3}>
                      Dashboard
                    </Button>
                  </NextLink>
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign Out
                  </Button>
                </Flex>
              ) : (
                <Flex align="center">
                  <NextLink href="/auth/signin" passHref legacyBehavior>
                    <Button as="a" variant="ghost" mr={3}>
                      Sign In
                    </Button>
                  </NextLink>
                  <NextLink href="/auth/signup" passHref legacyBehavior>
                    <Button as="a" colorScheme="blue">
                      Sign Up
                    </Button>
                  </NextLink>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Flex>
      <Box as="main" p={4}>
        {children}
      </Box>
    </Box>
  );
}