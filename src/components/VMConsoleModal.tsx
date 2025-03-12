import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";

type VMConsoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vm: {
    id: string;
    name: string;
    status: string;
  };
};

export default function VMConsoleModal({ isOpen, onClose, vm }: VMConsoleModalProps) {
  const bgColor = useColorModeValue("black", "gray.900");
  const textColor = useColorModeValue("green.400", "green.200");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent maxW="900px" maxH="600px">
        <ModalHeader>VM Console: {vm.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            bg={bgColor}
            color={textColor}
            p={4}
            borderRadius="md"
            height="500px"
            overflow="hidden"
            position="relative"
          >
            {vm.status === "running" ? (
              <Flex
                justifyContent="center"
                alignItems="center"
                height="100%"
                flexDirection="column"
              >
                <Text fontSize="lg" mb={4}>
                  Virtual Machine Console
                </Text>
                <Text>
                  In a production environment, this would display a live KVM console
                  connected to your virtual machine.
                </Text>
              </Flex>
            ) : (
              <Flex
                justifyContent="center"
                alignItems="center"
                height="100%"
              >
                <Text>VM is not running. Please start the VM to access the console.</Text>
              </Flex>
            )}
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}