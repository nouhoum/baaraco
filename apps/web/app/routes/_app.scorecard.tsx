import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Flex,
  Button,
  Input,
  Textarea,
  Badge,
  Circle,
  Grid,
} from "@chakra-ui/react";
import type { MetaFunction } from "react-router";
import { Plus, Trash2, GripVertical, Sparkles, Info } from "lucide-react";

export const meta: MetaFunction = () => {
  return [{ title: "Scorecard & Rubrics - Baara Proof" }];
};

interface Dimension {
  id: string;
  name: string;
  weight: number;
  rubric: string;
  examples: string;
}

export default function Scorecard() {
  const [dimensions, setDimensions] = useState<Dimension[]>([
    {
      id: "1",
      name: "Production ownership",
      weight: 30,
      rubric: "1: Reactive only | 2: Basic monitoring | 3: Proactive + incidents | 4: Architecture + prevention",
      examples: "PR with monitoring, incident postmortem",
    },
    {
      id: "2",
      name: "System design",
      weight: 25,
      rubric: "1: Component level | 2: Service level | 3: Cross-service | 4: Platform-wide trade-offs",
      examples: "Design doc, architecture RFC",
    },
    {
      id: "3",
      name: "Performance mindset",
      weight: 20,
      rubric: "1: Aware of basics | 2: Profiles code | 3: Optimizes hot paths | 4: Designs for scale",
      examples: "Profiling output, optimization PR",
    },
    {
      id: "4",
      name: "Communication",
      weight: 15,
      rubric: "1: Functional | 2: Clear async | 3: Structured docs | 4: Aligns stakeholders",
      examples: "Technical writeup, incident communication",
    },
    {
      id: "5",
      name: "Go expertise",
      weight: 10,
      rubric: "1: Basic syntax | 2: Idiomatic patterns | 3: Concurrency | 4: Performance + internals",
      examples: "Production Go code, PR reviews",
    },
  ]);

  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const isValid = totalWeight === 100 && dimensions.every((d) => d.rubric && d.examples);

  const updateDimension = (id: string, field: keyof Dimension, value: string | number) => {
    setDimensions(
      dimensions.map((d) =>
        d.id === id
          ? { ...d, [field]: value }
          : d,
      ),
    );
  };

  const removeDimension = (id: string) => {
    if (dimensions.length > 1) {
      setDimensions(dimensions.filter((d) => d.id !== id));
    }
  };

  const addDimension = () => {
    const newId = String(Math.max(...dimensions.map(d => parseInt(d.id))) + 1);
    setDimensions([
      ...dimensions,
      {
        id: newId,
        name: "New dimension",
        weight: 0,
        rubric: "",
        examples: "",
      },
    ]);
  };

  return (
    <Box py={8} px={8} maxW="1000px" mx="auto">
      <Stack gap={6}>
        {/* Page Header */}
        <Flex justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading as="h1" fontSize="xl" color="text" mb={1} fontWeight="semibold">
              Scorecard & Rubrics
            </Heading>
            <Text fontSize="sm" color="text.muted">
              Score what you can cite. Feelings don't scale.
            </Text>
          </Box>

          {/* Weight indicator */}
          <Flex
            align="center"
            gap={2}
            bg={totalWeight === 100 ? "success.subtle" : "error.subtle"}
            px={3}
            py={1.5}
            borderRadius="full"
            border="1px solid"
            borderColor={totalWeight === 100 ? "success.muted" : "error.muted"}
            shadow="sm"
          >
            <Circle
              size="6px"
              bg={totalWeight === 100 ? "success" : "error"}
            />
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={totalWeight === 100 ? "success" : "error"}
            >
              {totalWeight}% / 100%
            </Text>
          </Flex>
        </Flex>

        {/* Help text */}
        <Box
          bg="info.subtle"
          borderRadius="xl"
          border="1px solid"
          borderColor="info.muted"
          px={4}
          py={3}
        >
          <Flex gap={3} align="start">
            <Circle size="24px" bg="info.muted" flexShrink={0} mt={0.5}>
              <Box color="info">
                <Info size={14} />
              </Box>
            </Circle>
            <Box>
              <Text fontSize="sm" color="info" fontWeight="medium" mb={0.5}>
                Evidence-based evaluation
              </Text>
              <Text fontSize="xs" color="text.muted" lineHeight="1.5">
                Each dimension needs a rubric (1-4 scale) + 2 evidence examples minimum.
                Examples: PR, incident write-up, design doc, profiling output.
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Dimensions List */}
        <Stack gap={3}>
          {dimensions.map((dimension, index) => (
            <Box
              key={dimension.id}
              bg="surface"
              borderRadius="xl"
              border="1px solid"
              borderColor="border"
              overflow="hidden"
              transition="all 0.15s"
              shadow="card"
              _hover={{ borderColor: "border.emphasis", shadow: "cardHover" }}
            >
              {/* Dimension Header */}
              <Flex
                px={5}
                py={3}
                borderBottom="1px solid"
                borderBottomColor="border.subtle"
                align="center"
                gap={3}
                bg="bg.subtle"
              >
                <Box color="text.placeholder" cursor="grab" _hover={{ color: "text.muted" }}>
                  <GripVertical size={14} />
                </Box>

                <Badge
                  bg="bg.muted"
                  color="text.muted"
                  fontSize="2xs"
                  fontWeight="semibold"
                  px={2}
                  py={0.5}
                  borderRadius="md"
                >
                  #{index + 1}
                </Badge>

                <Input
                  value={dimension.name}
                  onChange={(e) => updateDimension(dimension.id, "name", e.target.value)}
                  fontWeight="medium"
                  fontSize="sm"
                  color="text"
                  variant={"unstyled" as "outline"}
                  flex={1}
                  _hover={{ bg: "surface" }}
                  _focus={{ bg: "surface" }}
                  px={2}
                  py={1}
                  borderRadius="md"
                />

                <Flex align="center" gap={1.5}>
                  <Input
                    type="number"
                    value={dimension.weight}
                    onChange={(e) => updateDimension(dimension.id, "weight", parseInt(e.target.value) || 0)}
                    w="52px"
                    textAlign="center"
                    fontSize="sm"
                    fontWeight="medium"
                    borderRadius="lg"
                    size="sm"
                  />
                  <Text fontSize="sm" color="text.subtle" fontWeight="medium">%</Text>
                </Flex>

                <Button
                  variant="ghost"
                  size="xs"
                  p={1.5}
                  color="text.placeholder"
                  opacity={dimensions.length > 1 ? 1 : 0.3}
                  cursor={dimensions.length > 1 ? "pointer" : "not-allowed"}
                  onClick={() => removeDimension(dimension.id)}
                  _hover={{ color: "error", bg: "error.subtle" }}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </Button>
              </Flex>

              {/* Dimension Body */}
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={0}>
                <Box px={5} py={4} borderRight={{ md: "1px solid" }} borderRightColor="border.subtle">
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={2} textTransform="uppercase" letterSpacing="wider">
                    Rubric (1-4 scale)
                  </Text>
                  <Textarea
                    value={dimension.rubric}
                    onChange={(e) => updateDimension(dimension.id, "rubric", e.target.value)}
                    placeholder="1: Basic | 2: Competent | 3: Strong | 4: Expert"
                    rows={2}
                    fontSize="sm"
                    border="none"
                    bg="transparent"
                    p={0}
                    _focus={{ boxShadow: "none" }}
                    resize="none"
                    color="text.secondary"
                  />
                </Box>

                <Box px={5} py={4}>
                  <Text fontSize="2xs" fontWeight="medium" color="text.subtle" mb={2} textTransform="uppercase" letterSpacing="wider">
                    Evidence examples
                  </Text>
                  <Textarea
                    value={dimension.examples}
                    onChange={(e) => updateDimension(dimension.id, "examples", e.target.value)}
                    placeholder="PR link, design doc, incident postmortem..."
                    rows={2}
                    fontSize="sm"
                    border="none"
                    bg="transparent"
                    p={0}
                    _focus={{ boxShadow: "none" }}
                    resize="none"
                    color="text.secondary"
                  />
                </Box>
              </Grid>
            </Box>
          ))}
        </Stack>

        {/* Add Dimension Button */}
        <Button
          variant="outline"
          size="md"
          borderStyle="dashed"
          borderRadius="xl"
          borderColor="border"
          color="text.muted"
          fontWeight="normal"
          py={5}
          onClick={addDimension}
          _hover={{ bg: "bg.subtle", borderColor: "border.emphasis", color: "text" }}
        >
          <Flex align="center" gap={2}>
            <Plus size={16} />
            <Text>Add dimension</Text>
          </Flex>
        </Button>

        {/* Validation */}
        {totalWeight !== 100 && (
          <Box
            bg="error.subtle"
            borderRadius="lg"
            border="1px solid"
            borderColor="error.muted"
            px={4}
            py={3}
          >
            <Flex gap={2} align="center">
              <Circle size="6px" bg="error" />
              <Text fontSize="sm" color="error" fontWeight="medium">
                Total weight must equal 100%. Currently: {totalWeight}%
                {totalWeight > 100 ? ` (${totalWeight - 100}% over)` : ` (${100 - totalWeight}% remaining)`}
              </Text>
            </Flex>
          </Box>
        )}

        {/* CTAs - Properly proportioned */}
        <Flex gap={3} pt={2}>
          <Button
            size="md"
            bg="primary"
            color="white"
            shadow="button"
            _hover={{ bg: "primary.hover", transform: "translateY(-1px)", shadow: "buttonHover" }}
            _active={{ transform: "translateY(0)" }}
            _disabled={{ opacity: 0.5, cursor: "not-allowed", transform: "none" }}
            transition="all 0.15s"
            disabled={!isValid}
            fontWeight="medium"
            px={5}
            h="42px"
          >
            <Flex align="center" gap={2}>
              <Sparkles size={16} />
              <Text>Generate interview kit</Text>
            </Flex>
          </Button>
          <Button
            size="md"
            variant="outline"
            borderColor="border"
            color="text.secondary"
            fontWeight="normal"
            _hover={{ bg: "bg.subtle", borderColor: "border.emphasis" }}
            px={4}
            h="42px"
          >
            Save draft
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
}
