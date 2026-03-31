# Thoughts on Clean Code: Second Edition

## Introduction

"Clean Code" by Robert C. Martin (Uncle Bob) is one of the most influential books in software development - love it or hate it. It is a highly opinionated guide on writing quality software, covering code design, structure, refactoring, comments (or the lack thereof), and testing.

For better or for worse, the ideas presented in the original book were put under scrutiny, most notable examples of that being the debate between Robert Martin and Casey Muratori about software performance [^1] and also another debate between Robert Martin and prof. John Ousterhout [^2] about software design, comments and testing. The second debate between Uncle Bob and John Ousterhout is appended to the end of the second version of "Clean Code", while Casey is not even mentioned. Nevertheless, there are certain sections in the book that are more-or-less directed to Casey, but sadly Casey is not explicitly mentioned.

My first impression of the second edition was that it felt more defensive than authoritative, with Robert Martin trying to address points raised in those debates. Ultimately, the core ideas from the original book carry over largely unchanged:

- Overly extracting everything into smaller functions, emphasizing the importance of SRP (Single Responsibility Principle);
- Reducing the number of function parameters to the detriment of using global state for communication;
- Using inheritance and polymorphism instead of enums;
- Emphasis on TDD and writing tests for every line of code.

None of these ideas are inherently wrong - applied with judgment, they can genuinely improve readability. But knowing when to stop is just as important, and unfortunately, the book rarely offers clear guidance on where to draw the line.

The structure of the book is different compared to the original version. It is divided into four parts:

- Code: The core "Clean Code" material, rewritten with fresh examples — no longer Java-only, now featuring Golang, Python, and JavaScript as well;
- Design: Focuses on higher-level design principles, drawing heavily from "Clean Craftsmanship" and "Clean Architecture";
- Architecture: Largely recycled content from "Clean Architecture";
- Craftsmanship: Also drawn from "Clean Craftsmanship", but less about code and more about professional conduct and career advice.

I don't want to be too harsh on this, but the book feels disconnected at certain points. The architecture part is a nice addition, but if you are interested about Martin's thoughts about architecture, you should read the "Clean Architecture" book. It is somewhat less approachable than the topics from clean code, and hence a bit boring in my opinion, although I like reading about software architecture. The craftsmanship part I suggest skipping altogether.

## Refactoring

A huge part of this book is about refactoring. Uncle Bob takes a snippet of code considered "unclean" and gradually refactors it into a cleaner version.

Concrete example, in chapter 2 he presents an "un-clean" version of the Roman numerals problem:

```java
package fromRoman;

import java.util.Arrays;

public class FromRoman {

  public static int convert(String roman) {
    if (roman.contains("VIV") ||
      roman.contains("IVI") ||
      roman.contains("IXI") ||
      roman.contains("LXL") ||
      roman.contains("XLX") ||
      roman.contains("XCX") ||
      roman.contains("DCD") ||
      roman.contains("CDC") ||
      roman.contains("MCM")) {
      throw new InvalidRomanNumeralException(roman);
    }
    roman = roman.replace("IV", "4");
    roman = roman.replace("IX", "9");
    roman = roman.replace("XL", "F");
    roman = roman.replace("XC", "N");
    roman = roman.replace("CD", "G");
    roman = roman.replace("CM", "O");
    if (roman.contains("IIII") ||
      roman.contains("VV") ||
      roman.contains("XXXX") ||
      roman.contains("LL") ||
      roman.contains("CCCC") ||
      roman.contains("DD") ||
      roman.contains("MMMM")) {
      throw new InvalidRomanNumeralException(roman);
    }

    int[] numbers = new int[roman.length()];
    int i = 0;
    for (char digit : roman.toCharArray()) {
      switch (digit) {
        case 'I' -> numbers[i] = 1;
        case 'V' -> numbers[i] = 5;
        case 'X' -> numbers[i] = 10;
        case 'L' -> numbers[i] = 50;
        case 'C' -> numbers[i] = 100;
        case 'D' -> numbers[i] = 500;
        case 'M' -> numbers[i] = 1000;
        case '4' -> numbers[i] = 4;
        case '9' -> numbers[i] = 9;
        case 'F' -> numbers[i] = 40;
        case 'N' -> numbers[i] = 90;
        case 'G' -> numbers[i] = 400;
        case 'O' -> numbers[i] = 900;
        default -> throw new InvalidRomanNumeralException(roman);
      }
      i++;
    }
    int lastDigit = 1000;
    for (int number : numbers) {
      if (number > lastDigit) {
        throw new InvalidRomanNumeralException(roman);
      }
      lastDigit = number;
    }
    return Arrays.stream(numbers).sum();
  }

  public static
  class InvalidRomanNumeralException extends RuntimeException {
    public InvalidRomanNumeralException(String roman) {
    }
  }
}
```

We can all agree that this code is messy and bad. Robert, through a few steps, refactors it to this:

```java
package fromRoman;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class FromRoman {
  private String roman;
  List<Integer> numbers = new ArrayList<>();
  Map<Character, Integer> values = Map.of(
    'I', 1,
    'V', 5,
    'X', 10,
    'L', 50,
    'C', 100,
    'D', 500,
    'M', 1000);

  public FromRoman(String roman) {
    this.roman = roman;
  }

  public static int convert(String roman) {
    return new FromRoman(roman).doConversion();
  }

  private int doConversion() {
    checkForIllegalPrefixCombinations();
    checkForImproperRepetitions();
    convertToNumbers();
    checkNumbersAreInOrder();
    return numbers.stream().mapToInt(Integer::intValue).sum();
  }

  private void checkForIllegalPrefixCombinations() {
    if (roman.contains("VIV") ||
      roman.contains("IVI") ||
      roman.contains("IXI") ||
      roman.contains("LXL") ||
      roman.contains("XLX") ||
      roman.contains("XCX") ||
      roman.contains("DCD") ||
      roman.contains("CDC") ||
      roman.contains("MCM")) {
      throw new InvalidRomanNumeralException(roman);
    }
  }

  private void checkForImproperRepetitions() {
    for (String badRep : new String[]
                         {"IIII", "VV", "XXXX", "LL",
                          "CCCC", "DD", "MMMM"}) {
      if (roman.contains(badRep)) {
        throw new InvalidRomanNumeralException(roman);
      }
    }
  }

  private void convertToNumbers() {
    char[] chars = roman.toCharArray();
    int l = chars.length;
    for (int i = 0; i < l; i++) {
      char nextChar = i + 1 < l ? chars[i + 1] : 0;
      int nextValue = values.get(nextChar);
      switch (chars[i]) {
        case 'I' -> {
          if (nextChar == 'V' || nextChar == 'X') {
            numbers.add(nextValue - 1);
            i++;
          } else numbers.add(1);
        }
        case 'V' -> numbers.add(5);
        case 'X' -> {
          if (nextChar == 'L' || nextChar == 'C') {
            numbers.add(nextValue - 10);
            i++;
          } else numbers.add(10);
        }
        case 'L' -> numbers.add(50);
        case 'C' -> {
          if (nextChar == 'D' || nextChar == 'M') {
            numbers.add(nextValue - 100);
            i++;
          } else numbers.add(100);
        }
        case 'D' -> numbers.add(500);
        case 'M' -> numbers.add(100);
        default -> throw new InvalidRomanNumeralException(roman);
      }
    }
  }

  private void checkNumbersAreInOrder() {
    int lastDigit = 1000;
    for (int number : numbers) {
      if (number > lastDigit) {
        throw new InvalidRomanNumeralException(roman);
      }
      lastDigit = number;
    }
  }

  public static
  class InvalidRomanNumeralException extends RuntimeException {
    public InvalidRomanNumeralException(String roman) {
      super("Invalid Roman numeral: " + roman);
    }
  }
}
```

We can all agree that the refactored code is better than the original one, this is not a question. But, if we take a little bit of time to observe this code, we can spot the following things, which will become a trend in this book and how Uncle Bob refactors:

- No comments;
- Code extracted into short methods with long names, such as `checkForIllegalPrefixCombinations`, `checkForImproperRepetitions`;
- Methods without parameters, hence they work on a global state - class state to be more correct.

I don't necessarily have issue with longer names, and we will see, I kind of agree with the rules Uncle Bob adopts for naming. What I don't agree with is that longer names are used instead of providing a comment about what the method is supposed to be doing. We will talk about the book's opinion about comments (spoiler, there are certain opinions about comments in this book with which I sympathize). I think one or two sentences would have provided enough context about what a certain method does and more importantly, why it works like that.

The more egregious thing about this refactoring is the manipulation of the global state. To be clear, encapsulation exists for a reason, you have classes that encapsulate data and functionality. But there are cases, such as this, when keeping it pure is more advised. Having extracted state just because we want to reduce the number of parameters for a method is just comical.

There are other examples of refactoring in the book, chapter 3 "First Principles" provides a more in-depth exampe of refactoring by applying SOLID principles. The same trends apply to that example as well.

There are good examples as well. Chapter 13 by Jeff Langr presents the best refactoring example in the book - a library rental service demonstrating Single Responsibility Principle and Open-Close Principle. The use of singleton pattern for products and strategy pattern for fine calculation makes sense and shows how these principles can improve design without dogmatic over-application.

## Functions and Methods

Robert Martin’s stance on functions evolved from the first edition.

**Size and Abstraction**: Functions should be small and contain one level of abstraction. The challenge? Deciding what constitutes a “level of abstraction” varies from person to person and context to context.

**The Zero-Argument Clarification**: In Chapter 8, Martin clarifies his controversial first-edition claim that “the ideal number of arguments for a function is zero.” He explains that functions with fewer arguments are easier to understand and memorize. However, he uses this reasoning to justify using global/member variables to pass data between methods - a practice that creates hidden dependencies and makes code harder to reason about.

**The Stepdown Rule**: Each function call should descend one level of abstraction. In theory, code should read like well-written prose from top to bottom. In practice, we have IDEs with shortcuts to jump to implementations. We don’t typically read code linearly - we jump to implementations and back during debugging.

**Method Chains and the Law of Demeter**: The book advocates that modules shouldn’t know about the innards of objects they manipulate, leading to a stance against method chains. This principle has merit but can lead to unwieldy wrapper methods.

**The DRY Paradox**: When discussing loop duplication, Martin acknowledges that lambdas and `forEach` methods solve the problem elegantly. Yet he still recommends implementing Template Method or Strategy Pattern in classical OOP fashion. Please don’t do that. The lambda approach is the functional equivalent of the strategy pattern without unnecessary complexity.





## References

[^1] cmuratori-discussion: [link](https://github.com/unclebob/cmuratori-discussion)
[^2] A Philosophy of Software Design vs Clean Code: [link](https://github.com/johnousterhout/aposd-vs-clean-code)