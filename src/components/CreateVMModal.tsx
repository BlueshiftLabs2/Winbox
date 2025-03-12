import { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  RadioGroup,
  Radio,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";

type CreateVMModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
};

type FormData = {
  name: string;
  username: string;
  password: string;
  vcpuCount: number;
  gpuEnabled: boolean;
  osType: "windows11" | "custom";
  customIsoUrl?: string;
};

export default function CreateVMModal({ isOpen, onClose, onSubmit }: CreateVMModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      username: "",
      password: "",
      vcpuCount: 6,
      gpuEnabled: false,
      osType: "windows11",
    },
  });

  const osType = watch("osType");

  const onFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Error creating VM:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Virtual Machine</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>VM Name</FormLabel>
                <Input
                  {...register("name", {
                    required: "VM name is required",
                    minLength: {
                      value: 3,
                      message: "VM name must be at least 3 characters",
                    },
                  })}
                />
                <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.username}>
                <FormLabel>VM Username</FormLabel>
                <Input
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                  })}
                />
                <FormErrorMessage>{errors.username?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>VM Password</FormLabel>
                <Input
                  type="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>vCPU Count (6-24)</FormLabel>
                <Controller
                  name="vcpuCount"
                  control={control}
                  rules={{
                    required: "vCPU count is required",
                    min: {
                      value: 6,
                      message: "Minimum vCPU count is 6",
                    },
                    max: {
                      value: 24,
                      message: "Maximum vCPU count is 24",
                    },
                  }}
                  render={({ field }) => (
                    <NumberInput
                      min={6}
                      max={24}
                      value={field.value}
                      onChange={(valueString) => field.onChange(parseInt(valueString))}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  )}
                />
                <FormErrorMessage>{errors.vcpuCount?.message}</FormErrorMessage>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="gpu-enabled" mb="0">
                  Enable NVIDIA GPU
                </FormLabel>
                <Controller
                  name="gpuEnabled"
                  control={control}
                  render={({ field: { onChange, value, ref } }) => (
                    <Switch
                      id="gpu-enabled"
                      isChecked={value}
                      onChange={onChange}
                      ref={ref}
                      colorScheme="green"
                    />
                  )}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Operating System</FormLabel>
                <Controller
                  name="osType"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <RadioGroup onChange={onChange} value={value}>
                      <Stack direction="column">
                        <Radio value="windows11">Windows 11 (Pre-installed)</Radio>
                        <Radio value="custom">Custom ISO</Radio>
                      </Stack>
                    </RadioGroup>
                  )}
                />
              </FormControl>

              {osType === "custom" && (
                <FormControl isInvalid={!!errors.customIsoUrl}>
                  <FormLabel>Custom ISO URL</FormLabel>
                  <Input
                    {...register("customIsoUrl", {
                      required: "ISO URL is required for custom OS",
                      pattern: {
                        value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                        message: "Please enter a valid URL",
                      },
                    })}
                  />
                  <FormErrorMessage>{errors.customIsoUrl?.message}</FormErrorMessage>
                </FormControl>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={isLoading}
              loadingText="Creating..."
            >
              Create VM
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}