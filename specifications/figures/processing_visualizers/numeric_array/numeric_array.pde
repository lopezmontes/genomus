float[] numbers = {1, 0.618034, 1, 0.236068, 1, 0.304952, 1, 0.652476, 0.4, 0.01, 0.7, 0.2, 0.01, 0.6, 0.6, 0.8, 1, 0.888544, 0.4, 0.03, 0.51, 0.2, 0.03, 0.55, 0.2, 0.03, 0.51, 0.2, 0.03, 0.46, 0.6, 0.8, 0.2, 1, 0.326238, 0.05, 0.667539, 1, 0.944272, 0.06, 0,330709, 0.8, 0.8, 0.8, 0.8};
int arrayLength = numbers.length;

size(1920, 82);
background(255);

for (int a=0; a<arrayLength; a++) {
  fill(numbers[a]*255);
  rect(0+40*a, 0, 40, 40);
}

saveFrame();

//for (int a=0; a<20; a++) {
//  fill(numbers[a+32]*255);
//  rect(0+40*a, 40, 40, 40);
//}