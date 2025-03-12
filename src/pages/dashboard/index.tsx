import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Box,
  Button,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Spinner,
  useToast,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import Layout from "@/components/Layout";
import CreateVMModal from "@/components/CreateVMModal";
import VMCard from "@/components/VMCard";

type VM = {
  id: string;
  name: string;
  username: string;
  password: string;
  vcpuCount: number;
  gpuEnabled: boolean;
  status: string;
  ipAddress: string | null;
  osType: string;
  customIsoUrl: string | null;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [vms, setVms] = useState<VM[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchVMs();
    }
  }, [session]);

  const fetchVMs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/vms");
      setVms(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch VMs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVMAction = async (id: string, action: string) => {
    try {
      await axios.put(`/api/vms/${id}`, { action });
      fetchVMs();
      toast({
        title: "Success",
        description: `VM ${action === "start" ? "started" : "stopped"} successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} VM`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleVMDelete = async (id: string) => {
    try {
      await axios.delete(`/api/vms/${id}`);
      fetchVMs();
      toast({
        title: "Success",
        description: "VM deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete VM",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateVM = async (vmData: any) => {
    try {
      await axios.post("/api/vms", vmData);
      onClose();
      fetchVMs();
      toast({
        title: "Success",
        description: "VM created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create VM",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <Layout>
        <Flex justify="center" align="center" height="50vh">
          <Spinner size="xl" thickness="4px" color="blue.500" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box mb={6}>
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading as="h1" size="xl">
            My Virtual Machines
          </Heading>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={onOpen}
            isDisabled={vms.length >= 3}
          >
            Create VM
          </Button>
        </Flex>
        
        {vms.length >= 3 && (
          <Alert status="warning" borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertTitle mr={2}>VM Limit Reached!</AlertTitle>
            <AlertDescription>
              You can create a maximum of 3 virtual machines.
            </AlertDescription>
          </Alert>
        )}
        
        {vms.length === 0 && !isLoading && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>No VMs Found</AlertTitle>
            <AlertDescription>
              You haven't created any virtual machines yet. Click the "Create VM" button to get started.
            </AlertDescription>
          </Alert>
        )}
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {vms.map((vm) => (
          <VMCard
            key={vm.id}
            vm={vm}
            onStart={(id) => handleVMAction(id, "start")}
            onStop={(id) => handleVMAction(id, "stop")}
            onDelete={handleVMDelete}
          />
        ))}
      </SimpleGrid>

      <CreateVMModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateVM}
      />
    </Layout>
  );
}