<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="container mx-auto p-10 flex justify-center items-center h-screen">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="">
			<Card.Title class="">Forgot your password?</Card.Title>
			<Card.Description class="">Enter your email to receive a password reset link</Card.Description>
			
		</Card.Header>
		<Card.Content class="">
			<form>
				<div class="flex flex-col gap-6">
					<div class="grid gap-2">
						<Label for="email" class="">Email</Label>
						<Input id="email" type="email" placeholder="m@example.com" required class="" />
					</div>
				</div>
			</form>
		</Card.Content>
		<Card.Footer class="flex-col gap-2">
      <Button type="submit" class="w-full" disabled={false}>Send reset link</Button>
      <Card.Action class="">
        <p class="text-sm text-gray-500">
				<a href="/login" class="text-blue-500 underline underline-offset-4 hover:underline font-medium">Back to login</a>
        </p>
			</Card.Action>
		</Card.Footer>
	</Card.Root>
</div>
