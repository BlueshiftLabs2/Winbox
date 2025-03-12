import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaServer, FaDesktop, FaCloudUploadAlt, FaShieldAlt } from "react-icons/fa";
import Layout from "@/components/Layout";

interface FeatureProps {
  title: string;
  text: string;
  icon: React.ReactElement;
}

const Feature = ({ title, text, icon }: FeatureProps) => {
  return (
    <Stack align="center" textAlign="center">
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        color="white"
        rounded="full"
        bg="blue.500"
        mb={4}
      >
        {icon}
      </Flex>
      <Text fontWeight={600} fontSize="lg">
        {title}
      </Text>
      <Text color={useColorModeValue("gray.600", "gray.400")}>
        {text}
      </Text>
    </Stack>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  // Add this to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Layout>
      <Box bg={useColorModeValue("gray.50", "gray.900")} py={20}>
        <Container maxW="container.xl">
          <Stack
            textAlign="center"
            align="center"
            spacing={{ base: 8, md: 10 }}
            py={{ base: 10, md: 20 }}
          >
            <Heading
              fontWeight={600}
              fontSize={{ base: "3xl", sm: "4xl", md: "6xl" }}
              lineHeight="110%"
            >
              Virtual Machines{" "}
              <Text as="span" color="blue.500">
                in Your Browser
              </Text>
            </Heading>
            <Text
              color={useColorModeValue("gray.600", "gray.400")}
              maxW="3xl"
              fontSize="xl"
            >
              BlueshiftLabs2winbox lets you create and manage powerful virtual machines
              directly in your browser. No software installation required.
              Get started with Windows 11 VMs with optional NVIDIA GPU support.
            </Text>
            <Stack spacing={6} direction={{ base: "column", md: "row" }}>
              {isClient && (
                <>
                  {session ? (
                    <Button
                      rounded="full"
                      px={6}
                      colorScheme="blue"
                      bg="blue.500"
                      _hover={{ bg: "blue.600" }}
                      onClick={() => router.push("/dashboard")}
                      size="lg"
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        rounded="full"
                        px={6}
                        colorScheme="blue"
                        bg="blue.500"
                        _hover={{ bg: "blue.600" }}
                        onClick={() => router.push("/auth/signup")}
                        size="lg"
                      >
                        Get Started
                      </Button>
                      <Button
                        rounded="full"
                        px={6}
                        onClick={() => router.push("/auth/signin")}
                        size="lg"
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                </>
              )}
            </Stack>
          </Stack>

          <Box py={10}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
              <Feature
                icon={<Icon as={FaServer} w={10} h={10} />}
                title="Powerful VMs"
                text="Create VMs with up to 24 vCPUs, 32GB RAM, and 280GB storage."
              />
              <Feature
                icon={<Icon as={FaDesktop} w={10} h={10} />}
                title="Browser Access"
                text="Access your VMs directly in your browser with zero installation."
              />
              <Feature
                icon={<Icon as={FaCloudUploadAlt} w={10} h={10} />}
                title="Custom OS"
                text="Use pre-installed Windows 11 or upload your own custom ISO."
              />
              <Feature
                icon={<Icon as={FaShieldAlt} w={10} h={10} />}
                title="Secure Access"
                text="Your VMs are protected with your custom username and password."
              />
            </SimpleGrid>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}