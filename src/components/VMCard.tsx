import {
  Box,
  Heading,
  Text,
  Badge,
  Button,
  HStack,
  VStack,
  useColorModeValue,
  Divider,
  Flex,
  IconButton,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { FaPlay, FaStop, FaTrash, FaDesktop } from "react-icons/fa";
import VMConsoleModal from "./VMConsoleModal";

type VMProps = {
  vm: {
    id: string;
    name: string;
    username: string;
    password: string;
    vcpuCount: number;
    gpuEnabled: boolean;
    status: string;
    ipAddress: string | null;
    osType: string;
  };
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function VMCard({ vm, onStart, onStop, onDelete }: VMProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "green";
      case "stopped":
        return "red";
      case "provisioning":
        return "yellow";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <>
      <Box
        p={5}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={borderColor}
        bg={bgColor}
        boxShadow="md"
        transition="all 0.2s"
        _hover={{ boxShadow: "lg" }}
      >
        <Flex justifyContent="space-between" alignItems="center" mb={3}>
          <Heading as="h3" size="md">
            {vm.name}
          </Heading>
          <Badge colorScheme={getStatusColor(vm.status)} fontSize="0.8em" px={2} py={1} borderRadius="full">
            {vm.status.charAt(0).toUpperCase() + vm.status.slice(1)}
          </Badge>
        </Flex>

        <VStack align="stretch" spacing={2} mb={4}>
          <Text>
            <strong>vCPUs:</strong> {vm.vcpuCount}
          </Text>
          <Text>
            <strong>RAM:</strong> 32GB
          </Text>
          <Text>
            <strong>Storage:</strong> 280GB
          </Text>
          <Text>
            <strong>GPU:</strong> {vm.gpuEnabled ? "Enabled" : "Disabled"}
          </Text>
          <Text>
            <strong>OS:</strong> {vm.osType === "windows11" ? "Windows 11" : "Custom ISO"}
          </Text>
          {vm.ipAddress && (
            <Text>
              <strong>IP Address:</strong> {vm.ipAddress}
            </Text>
          )}
        </VStack>

        <Divider mb={4} />

        <VStack align="stretch" spacing={2} mb={4}>
          <Text>
            <strong>Username:</strong> {vm.username}
          </Text>
          <Text>
            <strong>Password:</strong> {vm.password}
          </Text>
        </VStack>

        <HStack spacing={2} justifyContent="space-between">
          <Tooltip label="Access VM Console">
            <IconButton
              aria-label="Access VM Console"
              icon={<FaDesktop />}
              colorScheme="blue"
              onClick={onOpen}
              isDisabled={vm.status !== "running"}
            />
          </Tooltip>
          <HStack>
            {vm.status === "running" ? (
              <Tooltip label="Stop VM">
                <IconButton
                  aria-label="Stop VM"
                  icon={<FaStop />}
                  colorScheme="red"
                  onClick={() => onStop(vm.id)}
                />
              </Tooltip>
            ) : (
              <Tooltip label="Start VM">
                <IconButton
                  aria-label="Start VM"
                  icon={<FaPlay />}
                  colorScheme="green"
                  onClick={() => onStart(vm.id)}
                  isDisabled={vm.status === "provisioning"}
                />
              </Tooltip>
            )}
            <Tooltip label="Delete VM">
              <IconButton
                aria-label="Delete VM"
                icon={<FaTrash />}
                colorScheme="red"
                variant="outline"
                onClick={() => onDelete(vm.id)}
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Box>

      <VMConsoleModal isOpen={isOpen} onClose={onClose} vm={vm} />
    </>
  );
}